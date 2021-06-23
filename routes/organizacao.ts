import express = require("express");
import wrap = require("../infra/wrap");
import Causa = require("../models/causa");
import Organizacao = require("../models/organizacao");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");
import Representante = require("../models/representante");
import Equipe = require("../models/equipe");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("organizacao/alterar", {
			titulo: "Criar Organização",
			usuario: u,
			equipes: await Equipe.listar(),
			causas: await Causa.listar(),
			item: null
		});
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor)) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Organizacao = null;
		if (isNaN(id) || !(item = await Organizacao.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("organizacao/alterar", {
				titulo: "Editar Organização",
				usuario: u,
				equipes: await Equipe.listar(),
				causas: await Causa.listar(),
				item: item
			});
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("organizacao/listar", { titulo: "Gerenciar Organizações", usuario: u, lista: JSON.stringify(await Organizacao.listar()) });
}));

export = router;
