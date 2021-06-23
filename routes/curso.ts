﻿import express = require("express");
import wrap = require("../infra/wrap");
import Curso = require("../models/curso");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("curso/alterar", { titulo: "Criar Curso", usuario: u, item: null });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"] as string);
		let item: Curso = null;
		if (isNaN(id) || !(item = await Curso.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("curso/alterar", { titulo: "Editar Curso", usuario: u, item: item });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("curso/listar", { titulo: "Gerenciar Cursos", usuario: u, lista: JSON.stringify(await Curso.listar()) });
}));

export = router;
