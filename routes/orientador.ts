import express = require("express");
import wrap = require("../infra/wrap");
import Orientador = require("../models/orientador");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");
import Formacao = require("../models/formacao");
import Equipe = require("../models/equipe");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("orientador/alterar", {
			titulo: "Criar Orientador",
			usuario: u,
			item: null,
			formacoes: await Formacao.listar(),
			equipes: await Equipe.listar()
		});
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor)) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Orientador = null;
		if (isNaN(id) || !(item = await Orientador.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("orientador/alterar", {
				titulo: "Editar Orientador",
				usuario: u,
				item: item,
				formacoes: await Formacao.listar(),
				equipes: await Equipe.listar()
			});
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("orientador/listar", { titulo: "Gerenciar Orientadores", usuario: u, lista: JSON.stringify(await Orientador.listar()) });
}));

export = router;
