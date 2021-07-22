export default class AuthInterceptor {
	constructor(API_URI) {
		this.API_URI = API_URI;
		this.getStoredCredentials();
	}

	storeCredentials() {
		localStorage.setItem('acessToken', this.accessToken);
		localStorage.setItem('refreshToken', this.refreshToken);
	}

	getStoredCredentials() {
		let accessToken = localStorage.getItem('accessToken') || null,
			refreshToken = localStorage.getItem('refreshToken') || null;

		this.accessToken = accessToken;
		this.refreshToken = refreshToken;

		return !!(accessToken && refreshToken);
	}

	authenticate(email, password) {
		return new Promise((resolve, reject) => {
			fetch(`${this.API_URI}/auth/login`, {
				method: 'POST',
				body: { email, password }
			})
			.then(response => response.json())
			.then(data => {
				if(!data.error) {
					this.accessToken = data.accessToken;
					this.refreshToken = data.refreshToken;
					this.storeCredentials();
					resolve();
				}
				else
					reject(data.error);
			})
			.catch(err => reject(err));
		});
	}

	refreshTokens() {
		return new Promise((resolve, reject) => {
			fetch(`${this.API_URI}/auth/refresh`, {
				method: 'POST',
				body: JSON.stringify({ refreshToken: this.refreshToken })
			})
			.then(response => response.json())
			.then(data => {
				if(!data.error) {
					this.accessToken = data.accessToken;
					this.refreshToken = data.refreshToken;
					this.storeCredentials();
					resolve();
				}
				else
					reject(data.error);
			})
			.catch(err => reject(err));
		});
	}

	request(url, options) {
		return new Promise((resolve, reject) => {
			if(!this.accessToken)
				reject('Authentification required!');

			if(options.body)
				options.body = { ...options.body, accessToken: this.accessToken }
			else
				options.body = { accessToken: this.accessToken }

			fetch(url, options)
				.then(response => {
					if(response.ok)
						resolve(response);
					else {
						if(response.status == 401)
							this.refreshToken().then(() => this.request(url, options));
						else
							reject(response.status);
					}
				})
				.catch(err => reject(err));
		});
	}

}