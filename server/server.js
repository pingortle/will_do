Meteor.publish('events', function() {
	var groups = Groups.find({
		$or: [{owner: this.userId}, {member: this.userId}],
		fields: {_id: 1},
	}).map(function(x) {return x;});
	return Events.find({ $or: [{owner: this.userId}, {group: {$in: groups}}] });
});

Meteor.publish('groups', function() {
	return Groups.find();
});
