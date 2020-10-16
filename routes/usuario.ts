﻿import express = require("express");
import wrap = require("express-async-error-wrapper");
import Cargo = require("../models/cargo");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("usuario/alterar", {
			titulo: "Criar Usuário",
			usuario: u,
			item: null,
			cargos: await Cargo.listar()
		});
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"]);
		let item: Usuario = null;
		if (isNaN(id) || !(item = await Usuario.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("usuario/alterar", {
				titulo: "Editar Usuário",
				usuario: u,
				item: item,
				cargos: await Cargo.listar()
			});
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("usuario/listar", {
			titulo: "Gerenciar Usuários",
			usuario: u,
			lista: JSON.stringify(await Usuario.listar())
		});
}));

export = router;
