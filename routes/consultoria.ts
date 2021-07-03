import express = require("express");
import wrap = require("../infra/wrap");
import Causa = require("../models/causa");
import Consultoria = require("../models/consultoria");
import Usuario = require("../models/usuario");
import Organizacao = require("../models/organizacao");
import Orientador = require("../models/orientador");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("consultoria/alterar", { 
			titulo: "Criar Consultoria", 
			usuario: u, 
			item: null,
			causas: await Causa.listar(),
			usuarios: await Usuario.listarDropDown(),
			orientadores: await Orientador.listarDropDown(),
			organizacoes: await Organizacao.listarDropDown()
		});
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		res.redirect(appsettings.root + "/login");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Consultoria = null;
		if (isNaN(id) || !(item = await Consultoria.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("consultoria/alterar", {
				titulo: "Editar Consultoria",
				usuario: u,
				item: item,
				causas: await Causa.listar(),
				usuarios: await Usuario.listarDropDown(),
				orientadores: await Orientador.listarDropDown(),
				organizacoes: await Organizacao.listarDropDown()
			});
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("consultoria/listar", {
			titulo: "Gerenciar Consultorias",
			usuario: u,
			lista: JSON.stringify(await Consultoria.listar())
		});
}));

export = router;
