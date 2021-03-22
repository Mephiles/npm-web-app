// GK packages
const Utilities = require('gk-utilities');
const OptionsValidator = require('gk-options-validator');

// Node packages
// Json
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
// Mongo
const mongoose = require('mongoose');

const DATABASE_OPTIONS_TEMPLATE = {
	users: 'boolean',
};
const JSON_DATABASE_OPTIONS_TEMPLATE = {
	files: {
		database: {
			type: 'file-path',
			fileType: 'json',
		},
	},
	defaultContent: 'object',
};
const MONGO_DATABASE_OPTIONS_TEMPLATE = {
	models: {
		folder: 'folder-path',
		files: {
			type: 'list',
			listContents: 'file-path',
		},
	},
};

const LOGIN_USER_OPTIONS = {
	username: 'string',
	password: 'string',
	id: 'number',
};

const REGISTER_USER_OPTIONS = {
	username: {
		type: 'string',
		required: true,
	},
	password: {
		type: 'string',
		required: true,
	},
};

class Database {
	WEB_APP;
	USERS;
	SALT;

	constructor(WebApp, options) {
		new OptionsValidator(DATABASE_OPTIONS_TEMPLATE, options).ToObject();
		this.WEB_APP = WebApp;
		this.SetupOptions(options);

		this.SALT = '298m!5&nxlo__vnru4';
	}

	SetupOptions(options) {
		this.USERS = options.users ?? false;
	}

	AuthenticateUser(user, password) {
		let result;

		result = password;
		result += this.SALT;
		result = Utilities.Encrypt.Hash256(password);

		if (user.password === result) {
			return true;
		}
		return false;
	}
}

class JsonDatabase extends Database {
	ADAPTER;
	DB;

	constructor(WebApp, options) {
		super(WebApp, options);
		new OptionsValidator(JSON_DATABASE_OPTIONS_TEMPLATE, options).ToObject();

		this.ADAPTER = new FileSync(options.files.database);
		this.DB = low(this.ADAPTER);

		this.DB.defaults(options.defaultContent).write();
	}

	LoginUser(options) {
		new OptionsValidator(LOGIN_USER_OPTIONS, options);

		let key, value;
		if ('id' in options) {
			key = 'id';
			value = options.id;
		} else if ('username' in options) {
			key = 'username';
			value = options.username;
		} else {
			throw new JsonDatabaseException(`No ID/username found on login.`);
		}

		const user = this.DB.get('users')
			.find({ [key]: value })
			.value();

		if (user === null) {
			throw new JsonDatabaseException(`No user with given ID/username found.`);
		}
		if (!('password' in options)) {
			throw new JsonDatabaseException(`No password found.`);
		}

		if (super.AuthenticateUser(user, password)) {
			// Save in session
			return user;
		}
		return null;
	}

	RegisterUser(options) {
		new OptionsValidator(REGISTER_USER_OPTIONS, options);

		this.ValidateUsername(options.username);
		this.ValidatePassword(options.password);

		this.DB.get('users').push(new User(username, password).ToObject()).write();

		this.LoginUser({
			username: options.username,
			password: options.password,
		});
	}

	LogoutUser() {}

	ValidateUsername(username) {
		const usernames = this.DB.get('users').map('username').value();
		if (usernames.includes(username)) {
			throw new JsonDatabaseException(`Username taken.`);
		}
	}
	ValidatePassword(password) {
		//TODO
	}
}

class MongoDatabase extends Database {
	MODELS;

	constructor(WebApp, options) {
		super(WebApp, options);
		new OptionsValidator(MONGO_DATABASE_OPTIONS_TEMPLATE, options).ToObject();
	}

	CreateUser() {}

	LoginUser() {}

	LogoutUser() {}
}

class DatabaseException extends Error {
	constructor(message) {
		super(message);
		this.name = 'DatabaseException';
	}
}

class JsonDatabaseException extends DatabaseException {
	constructor(message) {
		super(message);
		this.name = 'JsonDatabaseException';
	}
}

export default { JsonDatabase, MongoDatabase };
