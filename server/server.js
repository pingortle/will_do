Meteor.publish('events', function() {
	if (!this.userId)
		return this.ready();

	var groups = Groups.find({
		$or: [{owner: this.userId}, {members: this.userId}],
	},
	{
		fields: {_id: 1},
	}).map(function(x) {return x._id;});

	return Events.find({ $or: [{owner: this.userId}, {group: {$in: groups}}] });
});

Meteor.publish('groups', function() {
	return Groups.find();
});

Meteor.publish('fellowMembers', function() {
	var pendingMembers = _.flatten(
		Groups.find({owner: this.userId}).map(function(x) {
			return x.pendingMembers;
		}));

	var myMembers = _.flatten(
		Groups.find({members: this.userId, owner: this.userId}).map(function(x) {
			return x.members;
		}));

	var fellowMembers = _.without(_.union(pendingMembers, myMembers), this.userId);

	return Meteor.users.find({_id: {$in: fellowMembers}}, {fields: {username: 1, emails: 1, profile: 1}});
});
