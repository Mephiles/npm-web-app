const OptionsValidator = require('gk-options-validator');

const USER_OPTIONS_TEMPLATE = {
	username: 'string',
	password: 'string',
	id: 'number',
};

export default class User {
	// Basic data
	USERNAME;
	PASSWORD_HASH;
	UID;

	constructor(options) {
		const userOptions = new OptionsValidator(USER_OPTIONS_TEMPLATE, options).ToObject();
	}
}
