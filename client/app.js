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
});