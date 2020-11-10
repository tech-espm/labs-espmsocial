import express = require("express");
import wrap = require("express-async-error-wrapper");
import Causa = require("../models/causa");
import Ong = require("../models/ong");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");
import Representante = require("../models/representante");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("ong/alterar", {
			titulo: "Criar ONG",
			usuario: u,
			causas: await Causa.listar(),
			representantes: null,
			item: null
		});
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"]);
		let item: Ong = null;
		if (isNaN(id) || !(item = await Ong.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("ong/alterar", {
				titulo: "Editar ONG",
				usuario: u,
				causas: await Causa.listar(),
				representantes: await Representante.listar(id),
				item: item
			});
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("ong/listar", { titulo: "Gerenciar ONGs", usuario: u, lista: JSON.stringify(await Ong.listar()) });
}));

export = router;
