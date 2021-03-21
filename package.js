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

	constructor(options) {
		super(options);
		const appOptions = new OptionsValidator(WEB_APP_OPTIONS_TEMPLATE, options).ToObject();
		this.SetupOptons(appOptions);

		this.SetupRouter();
		this.SetupRoutes(options);
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
				this.SetupJsonDatabase();
				break;
			case 'mongodb':
				this.SetupMongoDatabase();
				break;
			default:
				break;
		}
	}
}

class WebAppException extends Error {
	constructor(message) {
		super(message);
		this.name = 'WebAppException';
	}
}
