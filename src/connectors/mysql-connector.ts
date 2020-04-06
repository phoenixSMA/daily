import { Connection, createConnection } from 'mysql';

export class MySQLConnector {
	private connection: Connection;
	private options = {
		host: 'localhost',
		user: 'root',
		password: '08062006',
		database: 'data'
	};

	constructor() {
		this.connection = createConnection(this.options);
		this.connection.connect((err) => {
			if (err) {
				console.error('error connecting: ' + err.stack);
				return;
			}
			console.log('MySQLConnector > constructor: connected as id ' + this.connection.threadId);
		});
	};

	public async query(queryString: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.connection.query(queryString, (err, results) => {
				if (err) {
					reject(err);
				}
				resolve(results);
			})
		})

	}

	public disconnect() {
		this.connection.end(() => {
			console.log('MySQLConnector > disconnected');
		});
	}
}
