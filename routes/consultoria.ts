import express = require("express");
import wrap = require("express-async-error-wrapper");
import Consultoria = require("../models/consultoria");
import Usuario = require("../models/usuario");
import Ong = require("../models/ong");
import Orientador = require("../models/orientador");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/criar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("consultoria/alterar", { 
            titulo: "Criar Consultoria", 
            usuario: u, 
            item: null,
            orientadores: await Orientador.listar(), 
            ongs: await Ong.listar()           
        });
}));

router.all("/alterar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin) {
		res.redirect(appsettings.root + "/acesso");
	} else {
		let id = parseInt(req.query["id"]);
		let item: Consultoria = null;
		if (isNaN(id) || !(item = await Consultoria.obter(id)))
			res.render("home/nao-encontrado", { usuario: u });
		else
			res.render("consultoria/alterar", { 
                titulo: "Editar Consultoria", 
                usuario: u, 
                item: item, 
                orientadores: await Orientador.listar(), 
                ongs: await Ong.listar() 
            });
	}
}));

router.get("/listar", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u || !u.admin)
		res.redirect(appsettings.root + "/acesso");
	else
		res.render("consultoria/listar", { 
            titulo: "Gerenciar Consultorias", 
            usuario: u, 
            lista: JSON.stringify(await Consultoria.listar()) 
        });
}));

export = router;
