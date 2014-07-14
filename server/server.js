Meteor.publish('events', function() {
	Events.find();
});
