import express = require("express");
import wrap = require("../infra/wrap");
import Usuario = require("../models/usuario");
import appsettings = require("../appsettings");

const router = express.Router();

router.all("/", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("home/dashboard", { titulo: "Dashboard", usuario: u });
}));

router.all("/offline", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/offline", { layout: "layout-vazio" });
}));

router.all("/manifest.webmanifest", wrap(async (req: express.Request, res: express.Response) => {
	res.contentType("application/manifest+json").render("home/manifest", { layout: "layout-vazio" });
}));

router.all("/sw.js", wrap(async (req: express.Request, res: express.Response) => {
	res.contentType("text/javascript").render("home/sw", { layout: "layout-vazio" });
}));

// TELAS QUE A BIA FEZ:
router.all("/consultoria", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/consultoria", { layout: "layout-simples" });
}));


router.all("/estruturaOrg", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/estruturaOrg", { layout: "layout-simples" });
}));

router.all("/aluno", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/aluno", { layout: "layout-simples" });
}));

// -----------------
router.all("/login", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u) {
		let mensagem: string = null;

		if (req.body.login || req.body.senha) {
			[mensagem, u] = await Usuario.efetuarLogin(req.body.login as string, req.body.senha as string, res);
			if (mensagem)
				res.render("home/login", { layout: "layout-externo", mensagem: mensagem });
			else
				res.redirect(appsettings.root + "/");
		} else {
			res.render("home/login", { layout: "layout-externo", mensagem: null });
		}
	} else {
		res.redirect(appsettings.root + "/");
	}
}));

router.all("/cadastro", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/cadastro", { layout: "layout-simples" });
}));

router.all("/beneficio", wrap(async (req: express.Request, res: express.Response) => {
	res.render("home/beneficio", { layout: "layout-simples" });
}));

router.get("/carteirinha/:id?", wrap(async (req: express.Request, res: express.Response) => {
	let id = parseInt(req.params["id"]);
	if (id) {
		let u = await Usuario.obter(id);
		res.render("home/carteirinha-externa", { layout: "layout-externo", titulo: "Carteirinha", usuario: u });
	} else {
		let u = await Usuario.cookie(req);
		if (!u)
			res.redirect(appsettings.root + "/login");
		else
			res.render("home/carteirinha", { titulo: "Carteirinha", usuario: u });
	}
}));

router.get("/acesso", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/login");
	else
		res.render("home/acesso", { titulo: "Sem Permissão", usuario: u });
}));

router.get("/perfil", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (!u)
		res.redirect(appsettings.root + "/");
	else
		res.render("home/perfil", { titulo: "Meu Perfil", usuario: u });
}));

router.get("/logout", wrap(async (req: express.Request, res: express.Response) => {
	let u = await Usuario.cookie(req);
	if (u)
		await u.efetuarLogout(res);
	res.redirect(appsettings.root + "/");
}));

export = router;
