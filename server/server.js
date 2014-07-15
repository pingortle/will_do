Meteor.publish('my_events', function() {
	if (!this.userId)
		return this.ready();

	return Events.find({owner: this.userId});
});

Meteor.smartPublish('groups', function() {
	var userId = this.userId;
	if (!userId) return;

	this.addDependency('groups', ['_id', 'members', 'owner'], function(group) {
		var id = group.owner === userId || _.contains(group.members, userId) ? group._id : "";
		return Events.find({group: id});
	});

	this.addDependency('groups', ['members', 'pendingMembers'], function(group) {
		var fellowMembers = group.owner === userId ? _.union(group.members, group.pendingMembers) : [];
		return Meteor.users.find({_id: {$in: fellowMembers}}, {fields: {username: 1, emails: 1, profile: 1}});
	});

	return Groups.find();
});
