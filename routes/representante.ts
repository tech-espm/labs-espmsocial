import express = require("express");
import wrap = require("../infra/wrap");
import Representante = require("../models/representante");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");
import Organizacao = require("../models/organizacao");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("representante/alterar", { titulo: "Criar Representante", usuario: u, item: null, organizacoes: await Organizacao.listarDropDown() });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor)) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Representante = null;
		if (isNaN(id) || !(item = await Representante.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("representante/alterar", { titulo: "Editar Representante", usuario: u, item: item, organizacoes: await Organizacao.listarDropDown() });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || (!u.admin && !u.gestor))
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("representante/listar", { titulo: "Gerenciar Representante", usuario: u, lista: JSON.stringify(await Representante.listar()) });
}));

export = router;
