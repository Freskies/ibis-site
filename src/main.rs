use askama::Template;
use serde::Deserialize;
use std::{error::Error, fs, path::Path, process};

type Result<T> = std::result::Result<T, Box<dyn Error>>;
const LANGUAGES: [&str; 2] = ["it", "en"];

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Site {
	base_url: String,
}

impl Site {
	fn load(root: &Path) -> Result<Self> {
		let path = root.join("site.toml");
		let source = fs::read_to_string(&path)
			.map_err(|error| format!("Impossibile leggere {}: {error}", path.display()))?;
		let mut site: Self = toml::from_str(&source)
			.map_err(|error| format!("Configurazione non valida in {}: {error}", path.display()))?;
		site.base_url = site.base_url.trim_end_matches('/').to_string();
		let host = site.base_url.strip_prefix("https://").unwrap_or_default();
		if host.is_empty()
			|| !host.contains('.')
			|| !host
				.chars()
				.all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-'))
		{
			return Err("site.toml: base_url deve essere un'origine HTTPS senza percorsi, query o frammenti (es. https://www.ibissrl.biz)".into());
		}
		Ok(site)
	}
}

struct Seo<'a> {
	base_url: &'a str,
	url: String,
	title: String,
	description: &'a str,
	is_home: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Texts {
	language_name: String,
	language_short: String,
	page_title: String,
	description: String,
	skip_link: String,
	home_label: String,
	main_navigation: String,
	language_navigation: String,
	chooser_title: String,
	chooser_intro: String,
	company_name: String,
	hero_eyebrow: String,
	hero_title: String,
	hero_intro: String,
	hero_link: String,
	hero_contact: String,
	location: String,
	since: String,
	about_title: String,
	about_paragraphs: Vec<String>,
	products_title: String,
	products_intro: String,
	products: Vec<Product>,
	services_title: String,
	services_intro: String,
	services: Vec<Service>,
	contact_title: String,
	contact_location_label: String,
	address: String,
	contacts: Vec<Contact>,
	company_details: Vec<String>,
	policy_link: String,
	policy: PolicyTexts,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Contact {
	name: String,
	email: String,
	phone: String,
	phone_label: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct PolicyTexts {
	title: String,
	description: String,
	intro: String,
	sections: Vec<Service>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Product {
	name: String,
	detail: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Service {
	title: String,
	text: String,
}

#[derive(Template)]
#[template(path = "home.html")]
struct Home<'a> {
	lang: &'a str,
	texts: &'a Texts,
	languages: &'a [(String, Texts)],
	page_filename: &'a str,
	seo: Seo<'a>,
}

#[derive(Template)]
#[template(path = "policy.html")]
struct Policy<'a> {
	lang: &'a str,
	texts: &'a Texts,
	languages: &'a [(String, Texts)],
	page_filename: &'a str,
	seo: Seo<'a>,
}

#[derive(Template)]
#[template(path = "languages.html")]
struct LanguageChoice<'a> {
	languages: &'a [(String, Texts)],
	seo: Seo<'a>,
}

#[derive(Template)]
#[template(path = "sitemap.xml")]
struct Sitemap<'a> {
	base_url: &'a str,
	languages: &'a [&'a str],
}

fn load_texts(root: &Path, lang: &str) -> Result<Texts> {
	let path = root.join("locales").join(format!("{lang}.toml"));
	let source = fs::read_to_string(&path)
		.map_err(|error| format!("Impossibile leggere {}: {error}", path.display()))?;
	let texts = toml::from_str::<Texts>(&source).map_err(|error| {
		format!(
			"Traduzione non valida o incompleta in {}: {error}",
			path.display()
		)
	})?;
	validate_value(&toml::from_str::<toml::Value>(&source)?, "")
		.map_err(|error| format!("Traduzione incompleta in {}: {error}", path.display()))?;
	Ok(texts)
}

// Include stringhe e liste annidate, come prodotti e attività.
fn validate_value(value: &toml::Value, key: &str) -> Result<()> {
	match value {
		toml::Value::String(text) if text.trim().is_empty() => {
			return Err(format!("il campo '{key}' è vuoto").into());
		}
		toml::Value::Array(items) => {
			if items.is_empty() {
				return Err(format!("la lista '{key}' è vuota").into());
			}
			for (index, item) in items.iter().enumerate() {
				validate_value(item, &format!("{key}[{index}]"))?;
			}
		}
		toml::Value::Table(items) => {
			for (name, item) in items {
				let field = if key.is_empty() {
					name.clone()
				} else {
					format!("{key}.{name}")
				};
				validate_value(item, &field)?;
			}
		}
		_ => {}
	}
	Ok(())
}

fn copy_assets(source: &Path, destination: &Path) -> Result<()> {
	fs::create_dir_all(destination)?;
	for entry in fs::read_dir(source)? {
		let entry = entry?;
		let target = destination.join(entry.file_name());
		let kind = entry.file_type()?;
		if kind.is_dir() {
			copy_assets(&entry.path(), &target)?;
		} else if kind.is_file() {
			fs::copy(entry.path(), target)?;
		} else {
			return Err(format!("Asset non supportato: {}", entry.path().display()).into());
		}
	}
	Ok(())
}

fn generate() -> Result<()> {
	let root = Path::new(env!("CARGO_MANIFEST_DIR"));
	let site = Site::load(root)?;
	let languages = LANGUAGES
		.iter()
		.map(|lang| Ok((lang.to_string(), load_texts(root, lang)?)))
		.collect::<Result<Vec<_>>>()?;
	// Convalida e rendering prima di scrivere l'output.
	let pages = languages
		.iter()
		.map(|(lang, texts)| {
			Ok((
				lang,
				Home {
					lang,
					texts,
					languages: &languages,
					page_filename: "index.html",
					seo: Seo {
						base_url: &site.base_url,
						url: format!("{}/{lang}/", site.base_url),
						title: texts.page_title.clone(),
						description: &texts.description,
						is_home: true,
					},
				}
				.render()?,
				Policy {
					lang,
					texts,
					languages: &languages,
					page_filename: "privacy.html",
					seo: Seo {
						base_url: &site.base_url,
						url: format!("{}/{lang}/privacy.html", site.base_url),
						title: format!("{} — {}", texts.policy.title, texts.company_name),
						description: &texts.policy.description,
						is_home: false,
					},
				}
				.render()?,
			))
		})
		.collect::<Result<Vec<_>>>()?;
	let choice = LanguageChoice {
		languages: &languages,
		seo: Seo {
			base_url: &site.base_url,
			url: format!("{}/", site.base_url),
			title: format!(
				"IBIS — {}",
				languages
					.iter()
					.map(|(_, texts)| texts.chooser_title.as_str())
					.collect::<Vec<_>>()
					.join(" / ")
			),
			description: &languages[0].1.chooser_intro,
			is_home: true,
		},
	}
	.render()?;
	let sitemap = Sitemap {
		base_url: &site.base_url,
		languages: &LANGUAGES,
	}
	.render()?;
	let dist = root.join("dist");
	copy_assets(&root.join("static"), &dist.join("assets"))?;
	for (lang, html, policy) in pages {
		let directory = dist.join(lang);
		fs::create_dir_all(&directory)?;
		fs::write(directory.join("index.html"), html)?;
		fs::write(directory.join("privacy.html"), policy)?;
	}
	fs::write(dist.join("index.html"), choice)?;
	fs::write(dist.join("sitemap.xml"), sitemap)?;
	fs::write(
		dist.join("robots.txt"),
		format!(
			"User-agent: *\nAllow: /\n\nSitemap: {}/sitemap.xml\n",
			site.base_url
		),
	)?;
	println!("Sito generato in {} (it, en)", dist.display());
	Ok(())
}

fn main() {
	if let Err(error) = generate() {
		eprintln!("Generazione fallita: {error}");
		process::exit(1);
	}
}
