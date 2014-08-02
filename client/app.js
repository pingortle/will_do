Meteor.subscribe('my_events');
Meteor.subscribe('groups');

var monthNames = moment.months();

Template.calendar.created = function() {
	Session.set('selectedMonth', moment().startOf('month').toDate());
	Session.set('currentTime', moment().toDate());
	Meteor.setInterval(function() {
			Session.set('currentTime', moment().toDate());
		},
		60000);
};

Template.calendar.helpers({
	monthName: function(month) {
		return monthNames[Session.get('selectedMonth').getMonth()];
	},
	weeks: function() {
		var currentMonth = moment(Session.get('selectedMonth'));
		var firstOfMonth = currentMonth.clone().startOf('month');
		var firstOfWeek = firstOfMonth.clone().startOf('week');
		var endOfMonth = currentMonth.clone().endOf('month');
		var endOfWeek = endOfMonth.clone().endOf('week');
		var weeksOfMonth = [];

		var range = moment().range(firstOfWeek, endOfWeek);

		range.by('weeks', function(week) {
			var currentWeek = [];
			moment()
				.range(week.clone().startOf('week'), week.clone().endOf('week'))
				.by('days', function(day) {
					currentWeek.push(day);
				});
				weeksOfMonth.push(currentWeek);
		});

		return weeksOfMonth;
	},
});

Template.calendar.events({
	'click .increment-month': function() {
		var date = moment(Session.get('selectedMonth'));
		Session.set('selectedMonth', date.add('month', 1).toDate());
	},
	'click .decrement-month': function() {
		var date = moment(Session.get('selectedMonth'));
		Session.set('selectedMonth', date.subtract('month', 1).toDate());
	},
});

var isPastDate = function(date, now) {
	now = now || moment();
	return moment(date).endOf('day').isBefore(moment(now));
};

Template.day.helpers({
	isMyEvent: function(event) {
		return event.owner === Meteor.userId();
	},
	isPastDate: function(date) {
		return isPastDate(date, Session.get('currentTime')) ? 'past-calendar-day' : '';
	},
	dayOfMonth: function(date) {
		return date.date();
	},
	isInMonth: function(date) {
		return date.month() === Session.get('selectedMonth').getMonth() ? 'day-in-month' : 'day-out-of-month';
	},
	timeOfDay: function(date) {
		return moment(date).format("h:mm A");
	},
	groupName: function(event) {
		return (Groups.findOne(event.group) || {name: "Private"}).name;
	},
	theEvents: function(date) {
		date = moment(date);
		return Events.find({
			date: {
				$gte: date.clone().startOf('day').toDate(),
				$lte: date.clone().endOf('day').toDate()
			},
		}, {
			sort: {date: 1},
		});
	},
	willDo: function(eventId, will) {
		var ev = Events.findOne(eventId);
		var rsvp = null;
		if (ev) {
			rsvp = _.find(
			ev.rsvps,
			function(rsvp) {
				return rsvp.user === Meteor.userId();
			});
		}
		return rsvp && rsvp.willDo === will ?  'active' : '';
	},
	howManyDoing: function(eventId) {
		var ev = Events.findOne(eventId);
		if (ev)
			return _.filter(ev.rsvps, function(x) {return x.willDo;}).length;
		else
			return '';
	},
});

var getEventId = function(element) {
	var targetQuery = $(element);
	var eventId = targetQuery.closest(".event-item")[0].dataset.eventId;

	return eventId;
};

Template.day.events({
	'click .calendar-day': function() {
		if (!isPastDate(this)) {
			var date = moment(this).startOf('day');
			 Session.set('selectedDay', date.toDate());
			 $('#add_event_modal').modal();
		}
	},
	'click .close': function(e) {
		Events.remove({_id: e.currentTarget.dataset.eventId});
		return false;
	},
	'click .will-do': function(e) {
		Meteor.call('willDo', getEventId(e.currentTarget), function (error, result) {
			if (error) console.log(error);
		});
		return false;
	},
	'click .wont-do': function(e) {
		Meteor.call('wontDo', getEventId(e.currentTarget), function (error, result) {
			if (error) console.log(error);
		});
		return false;
	},
});

var myGroups = function() {
	return Groups.find({owner: Meteor.userId()});
};

Template.my_groups.helpers({
	groups: myGroups,
	joinedGroups: function() {
		return Groups.find({members: Meteor.userId(), owner: {$not: Meteor.userId()}});
	},
	getUsername: function(uID) {
		var user = Meteor.users.findOne(uID);
		if (!user)
			return "";

		if (user.username)
			return user.username;
		if (user.emails && user.emails.length > 0)
			return user.emails[0].address;

		return "Anonymous User";
	},
});

var getPendingMemberInfo = function(element) {
	var targetQuery = $(element);
	var groupId = targetQuery.closest(".my-group")[0].dataset.groupId;
	var userId = targetQuery.closest(".pending-member")[0].dataset.userId;

	return {groupId: groupId, userId: userId};
};

Template.my_groups.events({
	'click button.new-group': function() {
		var newGroupNameField = $('#new_group_name')[0];

		Meteor.call('createGroup', {
			name: newGroupNameField.value,
			members: [Meteor.userId()],
		});

		newGroupNameField.value = "";
	},
	'click button.accept-member': function(e) {
		var membershipInfo = getPendingMemberInfo(e.currentTarget);
		Meteor.call('addMember', membershipInfo.groupId, membershipInfo.userId, function (error, result) {
			if (error)
				console.log(error);
		});
	},
	'click button.reject-member': function(e) {
		var membershipInfo = getPendingMemberInfo(e.currentTarget);
		Groups.update(membershipInfo.groupId, {$pull: {pendingMembers: membershipInfo.userId}});
	},
});

Template.join_groups.helpers({
	groups: function() {
		return Groups.find({members: {$not: Meteor.userId()}, pendingMembers: {$not: Meteor.userId()}, owner: {$not: Meteor.userId()}});
	},
});

Template.join_groups.events({
	'click .unjoined-group': function(e) {
		Meteor.call('requestGroupMembership', e.currentTarget.dataset.groupId, function(error, result) {
			if (error)
				console.error(error);
		});
	}
});

Template.add_event_modal.helpers({
	eventDate: function() {
		return moment(Session.get("selectedDay")).format("dddd, MMMM Do YYYY");
	},
	groups: myGroups,
});

Template.add_event_modal.events({
	'click button.new-event': function() {
		var titleField = $('#new_event_title')[0];
		var timeField = $('#new_event_time')[0];
		var groupField = $('#new_event_group')[0];

		var date = moment(Session.get('selectedDay'));
		var time = moment(timeField.value, "HH:mm");
		date.startOf('day').hour(time.hour());
		date.minute(time.minute());
		var obj = {
			name: titleField.value,
			date: date.toDate(),
			group: groupField.value,
		};

		Meteor.call('createEvent', obj);

		titleField.value = '';
		timeField.value = '';
		$('#add_event_modal').modal('hide');
	},
});

Template.add_event_modal.rendered = function () {
		$('.clockpicker').clockpicker();
};
