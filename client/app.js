Meteor.subscribe('events');

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
	eventDate: function() {
		return moment(Session.get("selectedDay")).format("dddd, MMMM Do YYYY");
	},
});

Template.add_event_modal.events({
	'click button.new-event': function() {
		var titleField = $('#new_event_title')[0];
		var timeField = $('#new_event_time')[0];

		var date = moment(Session.get('selectedDay'));
		var time = moment(timeField.value, "HH:mm");
		date.startOf('day').hour(time.hour());
		date.minute(time.minute());
		var obj = {
			name: titleField.value,
			date: date.toDate(),
		};
		Events.insert(obj);

		titleField.value = '';
		timeField.value = '';
		$('#add_event_modal').modal('hide');
	},
});

Template.add_event_modal.rendered = function () {
		$('.clockpicker').clockpicker();
};
