﻿export = {
	// Se a aplicação estiver em uma subpasta, root deve ser "/pasta", por exemplo
	root: "",
	cookie: "usuarioESPMSocial",
	cookieSecure: false,
    port: 3000,
	sqlPool: {
		connectionLimit: 30,
		host: "localhost",
		port: 3306,
		user: "root",
		password: "root",
		database: "espmsocial"
	},
	// A senha padrão é 1234
	usuarioHashSenhaPadrao: "peTcC99vkvvLqGQL7mdhGuJZIvL2iMEqvCNvZw3475PJ:JVyo1Pg2HyDyw9aSOd3gNPT30KdEyiUYCjs7RUzSoYGN",
	// Não utilizar números > 0x7FFFFFFF, pois os XOR resultarão em -1
	usuarioHashId: 0x79bf012a
};
