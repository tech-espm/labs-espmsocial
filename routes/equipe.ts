import express = require("express");
import wrap = require("../infra/wrap");
import Equipe = require("../models/equipe");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("equipe/alterar", { titulo: "Criar Equipe", usuario: u, item: null });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Equipe = null;
		if (isNaN(id) || !(item = await Equipe.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("equipe/alterar", { titulo: "Editar Equipe", usuario: u, item: item });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("equipe/listar", { titulo: "Gerenciar Equipes", usuario: u, lista: JSON.stringify(await Equipe.listar()) });
}));

export = router;
