import express = require("express");
import wrap = require("express-async-error-wrapper");
import Representante = require("../models/representante");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");
import Ong = require("../models/ong");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("representante/alterar", { titulo: "Criar Representante", usuario: u, item: null, ongs: await Ong.listar() });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"]);
		let item: Representante = null;
		if (isNaN(id) || !(item = await Representante.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("representante/alterar", { titulo: "Editar Representante", usuario: u, item: item, ongs: await Ong.listar() });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("representante/listar", { titulo: "Gerenciar Representante", usuario: u, lista: JSON.stringify(await Representante.listar()) });
}));

export = router;
