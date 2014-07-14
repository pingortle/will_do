Events = new Meteor.Collection('events');

Events.allow({
	insert: function(uID, event) {
		return uID === event.owner;
	},
	update: function(uID, event) {
		return uID === event.owner;
	},
	remove: function(uID, event) {
		return uID === event.owner && attending(event) === 0;
	},
});

attending = function(event) {
	return (_.groupBy(event.rsvps, 'rsvp').yes || []).length;
};

Groups = new Meteor.Collection('groups');

Groups.allow({
	insert: function(uID, group) {
		return uID === group.owner;
	},
	update: function(uID, group) {
		return uID === group.owner;
	},
	remove: function(uID, group) {
		return uID === group.owner && (group.members || []).length === 0;
	}
});

if (Meteor.isServer)
	Groups._ensureIndex("name", {unique: 1});

var NonEmptyString = Match.Where(function (x) {
	check(x, String);
	return x.length !== 0;
});

var FutureDate = Match.Where(function(x) {
	check(x, Date);
	return moment(x).isAfter(moment());
})

var ArrayOfSome = Match.Where(function(x) {
	check(x, Array);
	return x.length > 0;
});

Meteor.methods({
	createEvent: function(options) {
		check(options, {
			name: NonEmptyString,
			date: FutureDate,
			group: Match.Optional(String),
		});

		return Events.insert({
			owner: this.userId,
			name: options.name,
			date: options.date,
			rsvps: [],
		});
	},

	createGroup: function(options) {
		check(options, {
			name: NonEmptyString,
			members: ArrayOfSome,
		});

		return Groups.insert({
			owner: this.userId,
			name: options.name,
			members: options.members,
		});
	},
});
