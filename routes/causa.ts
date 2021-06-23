import express = require("express");
import wrap = require("../infra/wrap");
import Causa = require("../models/causa");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("causa/alterar", { titulo: "Criar Causa", usuario: u, item: null });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		res.redirect(appsettings.root + "/login");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Causa = null;
		if (isNaN(id) || !(item = await Causa.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("causa/alterar", { titulo: "Editar Causa", usuario: u, item: item });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("causa/listar", { titulo: "Gerenciar Causas", usuario: u, lista: JSON.stringify(await Causa.listar()) });
}));

export = router;
