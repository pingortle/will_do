Meteor.subscribe('events');

var resetNewEvent = function() {
	Session.set("newEventTime", "12:00");
	Session.set("newEventTitle", "");
}

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

Template.calendar.helpers({
	monthName: function(month) {
		return monthNames[moment().month()];
	},
	weeks: function() {
		var firstOfMonth = moment().startOf('month');
		var firstOfWeek = firstOfMonth.clone().startOf('week');
		var endOfMonth = moment().endOf('month');
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

Template.day.helpers({
	dayOfMonth: function(date) {
		return date.date();
	},
	theEvents: function(date) {
		date = moment(date);
		 return Events.find({ date: { $gte: date.clone().startOf('day').toDate(), $lte: date.clone().endOf('day').toDate() } });
	},
});

Template.day.events({
	'click .calendar-day': function() {
		var date = moment(this);
		 Session.set('selectedDay', date.toDate());
		 $('#add_event_modal').modal();
	},
});

Template.add_event_modal.helpers({
	eventTime: function() {
		return Session.get("newEventTime");
	},
	eventDate: function() {
		return moment(Session.get("selectedDay")).format("dddd, MMMM Do YYYY");
	},
	title: function() {
		return Session.get("newEventTitle");
	},
});

Template.add_event_modal.events({
	'click button.new-event': function() {
		var date = moment(Session.get('selectedDay'));
		var time = moment(Session.get('newEventTime'), "HH:mm");
		date.startOf('day').hour(time.hour());
		date.minute(time.minute());
		var obj = {
			name: Session.get('newEventTitle'),
			date: date.toDate(),
		};
		Events.insert(obj);

		resetNewEvent();
		$('#add_event_modal').modal('hide');
	},
	'blur input[type="text"]': function(e) {
		if (e.target.id === 'new_event_title')
			Session.set('newEventTitle', e.target.value);
		else
			Session.set('newEventTime', e.target.value);
	},
});

Template.add_event_modal.rendered = function () {
    $('.clockpicker').clockpicker();
    resetNewEvent();
};
