"""Offline verification of the curated handoff, using only Python's standard library."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def require(condition,message):
    if not condition: errors.append(message)

required=['README.md','PROMPT.md','AGENTS.md','docs/BRIEF.md','docs/HANDOFF.md','docs/SKILLS.md',
    'docs/ASSETS_MANIFEST.json','data/catalog.json','data/content.json','reference-site/index.html',
    'reference-site/img/hero-desktop.webp','reference-site/img/hero-mobile.webp']
for item in required:require((ROOT/item).is_file(),f'Missing: {item}')

catalog=json.loads((ROOT/'data/catalog.json').read_text(encoding='utf-8'))
content=json.loads((ROOT/'data/content.json').read_text(encoding='utf-8'))
require(len(catalog)==37,'Expected 37 categories')
require(len({item['id'] for item in catalog})==37,'Duplicate category IDs')
require(len({item['group'] for item in catalog})==5,'Expected 5 catalogue groups')
for item in catalog:
    require((ROOT/item['image'].lstrip('/')).is_file(),f'Missing category image: {item["id"]}')
    require(item['priceAdult']>0,f'Invalid price: {item["id"]}')
    require(item['url'].startswith('https://goodsports.ru/'),f'Invalid category URL: {item["id"]}')
require(len(content['faq'])==10,'Expected 10 FAQ')
require(len(content['reviews'])==5,'Expected 5 reviews')
require(len(content['gallery'])==5,'Expected 5 gallery images')
for group in ['reviews','gallery']:
    for item in content[group]:require((ROOT/item['image'].lstrip('/')).is_file(),f'Missing content image: {item["image"]}')

for skill in ['frontend-design','impeccable','ui-ux-pro-max','web-design-guidelines']:
    base=ROOT/'.agents/skills'/skill
    manifest=base/'SKILL.md'
    require(manifest.is_file(),f'Missing skill: {skill}')
    text=manifest.read_text(encoding='utf-8')
    require('C:/Users/Admin' not in text and 'CLAUDE_PLUGIN_ROOT' not in text,f'Nonportable skill paths: {skill}')
    for link in re.findall(r'\]\(([^)]+)\)',text):
        if '://' not in link and not link.startswith('#'):
            p=link.split('#')[0]
            if p:require((base/p).exists(),f'Missing skill reference: {skill}/{p}')

class LocalReferences(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        value=a.get('src') if tag in ['img','script','source'] else a.get('href') if tag=='link' else None
        if value and not re.match(r'^(https?:|data:|#|//)',value):
            require((ROOT/'reference-site'/value).exists(),f'Missing HTML resource: {value}')
        if a.get('srcset') and not a['srcset'].startswith('http'):
            require((ROOT/'reference-site'/a['srcset']).exists(),f'Missing picture source: {a["srcset"]}')
source=(ROOT/'reference-site/index.html').read_text(encoding='utf-8')
LocalReferences().feed(source)
require('js/offline-guard.js' in source,'Offline form guard not loaded')
require('js/analytics.js' not in source and 'js/crm-widget.js' not in source,'Production tracking still loaded')

asset_manifest=json.loads((ROOT/'docs/ASSETS_MANIFEST.json').read_text(encoding='utf-8'))
for item in asset_manifest:
    p=ROOT/item['path']
    require(p.is_file(),f'Missing hashed asset: {item["path"]}')
    if p.is_file():require(hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],f'Hash mismatch: {item["path"]}')

for p in ROOT.rglob('*'):
    if not p.is_file() or '.git' in p.relative_to(ROOT).parts:continue
    rel=p.relative_to(ROOT).as_posix()
    require(not any(part in ['node_modules','.openai','.codex','__pycache__'] for part in p.relative_to(ROOT).parts),f'Unwanted local artifact: {rel}')
    require(not p.name.startswith('.env'),f'Environment file: {rel}')

if errors:
    print('\n'.join('ERROR: '+error for error in errors))
    sys.exit(1)
files=[p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.relative_to(ROOT).parts]
print(json.dumps(dict(status='PASS',categories=len(catalog),faq=len(content['faq']),reviews=len(content['reviews']),gallery=len(content['gallery']),skills=4,files=len(files),bytes=sum(p.stat().st_size for p in files)),ensure_ascii=False))
