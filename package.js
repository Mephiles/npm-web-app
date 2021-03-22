// Local modules
const { JsonDatabase, MongoDatabase } = require('Database');

// GK packages
const Utilities = require('gk-utilities');
const OptionsValidator = require('gk-options-validator');
const App = require('gk-app');

// Node packages
const express = require('express');
// const bodyParser = require('body-parser');
const favicon = require('serve-favicon');

const WEB_APP_OPTIONS_TEMPLATE = {
	port: 'number',
	path: {
		public: 'folder-path',
		favicon: 'file-path',
	},
	routes: {
		folder: 'folder-path',
		files: {
			type: 'list',
			listContents: 'file-path',
		},
		fallback: {
			function: 'function',
			view: 'file-path',
		},
	},
	database: {
		system: {
			type: 'string',
			acceptedValues: ['json', 'mongodb' /*, 'sql'*/],
		},
		file: 'file-path',
	},
};

export default class WebApp extends App {
	ROUTER;
	OPTIONS = {};
	DATABASE;

	constructor(options) {
		super(options);
		const appOptions = new OptionsValidator(WEB_APP_OPTIONS_TEMPLATE, options).ToObject();
		this.SetupOptons(appOptions);
		this.SetupRouter();
		this.SetupDatabase();

		// Listen
		this.ROUTER.listen(this.PORT, () => {
			super.Log(`Listening on port: ${this.PORT}`);
		});
	}

	// Setup

	SetupOptions(options) {
		this.OPTIONS = {
			PORT: options.port ?? 8080,
			PATH: {
				public: options.path?.public ?? '/public',
				favicon: options.path?.favicon ?? '/favicon.ico',
			},
			ROUTES: {
				files: options.routes?.files ?? [],
				fallback: {
					function: options.routes?.fallback?.function ?? undefined,
					view: options.routes?.fallback?.view ?? undefined,
				},
			},
			DATABASE: {
				system: options.database?.system ?? undefined,
				file: options.database?.system ?? undefined,
			},
		};
	}

	SetupRouter() {
		this.ROUTER = express();
		this.ROUTER.set('view engine', 'ejs');
		this.ROUTER.use(this.OPTIONS.PATH.public, express.static('public'));
		this.ROUTER.use(favicon(__dirname + this.OPTIONS.PATH.favicon));

		this.SetupRoutes();
	}

	SetupRoutes() {
		// Link route files
		for (const routeFilePath of this.OPTIONS.ROUTES.files) {
			this.ROUTER.use(require(routeFilePath));
		}

		// Fallback route
		this.ROUTER.get('*', (req, res) => {
			if ('fallback' in this.OPTIONS.ROUTES) {
				if ('function' in this.OPTIONS.ROUTES.fallback) {
					this.OPTIONS.ROUTES.fallback.function();
				} else if ('view' in this.OPTIONS.ROUTES.fallback) {
					return res.render(this.OPTIONS.ROUTES.view);
				}
			}
			super.Log(`[Warning] No fallback function/view implemented.`, true);
		});
	}

	SetupDatabase() {
		switch (this.OPTIONS.DATABASE.system) {
			case 'json':
				this.DATABASE = new JsonDatabase(this);
				break;
			case 'mongodb':
				this.DATABASE = new MongoDatabase(this);
				break;
			default:
				break;
		}
	}

	// User

	LoginUser(userModel) {
		return this.DATABASE.LoginUser(userModel);
	}

	// Response

	JsonResponse(object) {
		if (object instanceof Error) {
			return {
				success: false,
				data: object,
			};
		} else {
			return {
				success: true,
				data: object,
			};
		}
	}

	// Redirect methods

	render(...args) {
		return this.ROUTER.render(...args);
	}

	redirect(...args) {
		return this.ROUTER.redirect(...args);
	}

	get(...args) {
		return this.ROUTER.get(...args);
	}

	post(...args) {
		return this.ROUTER.post(...args);
	}

	GET(...args) {
		this.get(...args);
	}

	POST(...args) {
		this.port(...args);
	}
}

class WebAppException extends Error {
	constructor(message) {
		super(message);
		this.name = 'WebAppException';
	}
}
