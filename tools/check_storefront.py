"""Browser checks for the static storefront. Requires Python Playwright and Chromium.
Run with a local server: python3 tools/check_storefront.py http://127.0.0.1:4173/
Uses isolated browser profiles; does not send a production enquiry.
"""
import sys, tempfile
from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
ROOT=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
ARTIFACTS=Path(tempfile.mkdtemp(prefix='goodsports-browser-'))
def money(locator):
 return float(re.sub(r'[^0-9,]','',locator.inner_text()).replace(',','.'))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [1440,390,320]:
  page=b.new_page(viewport={'width':width,'height':900}, reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto(ROOT);page.evaluate('document.fonts.ready')
  assert page.locator('.print-disclosure').get_attribute('open') is None
  page.locator('.print-disclosure > summary').click()
  checks=page.locator('.service-picker input');assert checks.count()==6
  for box in checks.all():box.uncheck()
  add=page.get_by_role('button',name='Добавить нанесение в заявку')
  assert add.is_disabled(); assert money(page.locator('.unit-price strong'))==0
  checks.nth(0).check();checks.nth(3).check()
  assert money(page.locator('.unit-price strong'))==596.6
  quantity=page.get_by_role('spinbutton',name='Количество нанесений')
  quantity.fill('50');assert money(page.locator('.lab-total strong'))==29830
  quantity.fill('0');assert quantity.input_value()=='1'
  quantity.fill('10000');assert quantity.input_value()=='9999'
  quantity.fill('50');page.locator('#custom-name').fill('ТЕСТ КОМАНДА');page.locator('#custom-number').fill('7')
  add.click();page.locator('.bag').click()
  assert page.locator('.cart-dialog').is_visible()
  assert money(page.locator('.cart-total strong'))==29830
  assert 'ТЕСТ КОМАНДА / №7' in page.locator('.cart-items').inner_text()
  page.locator('[name=name]').fill('Проверка');page.locator('[name=contact]').fill('test@example.com')
  with page.expect_download() as info:page.get_by_role('button',name='Скачать заявку').click()
  download=info.value; text=Path(download.path()).read_text()
  assert 'ТЕСТ КОМАНДА' in text and '50 шт.' in text and '29' in text
  page.get_by_role('button',name='Закрыть заявку').click()
  page.reload();page.get_by_role('button',name='Получить расчёт',exact=True).click()
  assert money(page.locator('.cart-total strong'))==29830
  assert page.locator('[name=contact]').input_value()=='test@example.com'
  page.keyboard.press('Escape');assert not page.locator('.cart-dialog').is_visible()
  page.locator('.add-product').first.click();page.locator('.bag').click();assert page.locator('.cart-item').count()==2
  page.locator('.cart-item button').last.click();assert page.locator('.cart-item').count()==1
  page.get_by_role('button',name='Закрыть заявку').click()
  # All original testimonials are available in the stationary reduced-motion layout.
  assert page.locator('.gs-review-group:not([aria-hidden]) .gs-review-card').count()==5
  for card in page.locator('.gs-review-group:not([aria-hidden]) .gs-review-card').all():
   card.click();assert page.locator('.gs-review-dialog').is_visible();assert page.locator('.gs-review-dialog blockquote').inner_text()
   if page.locator('.gs-review-dialog a').count():
    response=page.request.get(page.locator('.gs-review-dialog a').get_attribute('href'))
    assert response.ok and response.headers['content-type'].startswith('image/')
   page.keyboard.press('Escape');assert not page.locator('.gs-review-dialog').is_visible()
  # Geometry and no movement for the static preference.
  assert page.locator('.gs-review-track').first.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
  assert page.get_by_role('button',name='Без автосмены').is_disabled()
  height=page.locator('.gs-gallery').bounding_box()['height']
  for i in range(5):
   page.get_by_role('button',name='Следующее фото',exact=True).click()
   assert abs(page.locator('.gs-gallery').bounding_box()['height']-height)<1
   assert page.locator('.gs-gallery-stage img.is-current').evaluate('(e)=>getComputedStyle(e).objectFit')=='contain'
  assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'overflow {width}'
  assert not errors,errors
  page.locator('.footer-call').scroll_into_view_if_needed();page.screenshot(path=str(ARTIFACTS / f'checked-cta-{width}.png'))
  print(width,'PASS calculator 596.60 × 50 = 29830; bounds, cart, export, persistence, removal, 5 reviews, gallery stability, reduced motion',flush=True)
  page.close()
 # Real-time movement and pause tests, no mocked timers.
 page=b.new_page(viewport={'width':1440,'height':1000})
 page.goto(ROOT);page.locator('.gs-gallery').scroll_into_view_if_needed();page.mouse.move(0,0)
 old=page.locator('.gs-gallery-stage img.is-current').get_attribute('src')
 page.wait_for_timeout(7200)
 assert page.locator('.gs-gallery-stage img.is-current').get_attribute('src')!=old,'autoplay'
 page.get_by_role('button',name='Пауза',exact=True).click();page.locator('.gs-gallery-controls button').first.evaluate('(e)=>e.blur()');page.mouse.move(0,0)
 old=page.locator('.gs-gallery-stage img.is-current').get_attribute('src');page.wait_for_timeout(7000)
 assert page.locator('.gs-gallery-stage img.is-current').get_attribute('src')==old,'pause'
 page.locator('.gs-reviews').scroll_into_view_if_needed();page.mouse.move(0,0);page.wait_for_timeout(900)
 tracks=page.locator('.gs-review-track')
 assert tracks.nth(0).evaluate('(e)=>getComputedStyle(e).animationDirection')=='normal'
 assert tracks.nth(1).evaluate('(e)=>getComputedStyle(e).animationDirection')=='reverse'
 assert tracks.nth(2).evaluate('(e)=>getComputedStyle(e).animationDirection')=='normal'
 assert tracks.first.evaluate('(e)=>getComputedStyle(e).animationPlayState')=='running'
 page.locator('.gs-review-window').hover();page.wait_for_timeout(100)
 assert tracks.first.evaluate('(e)=>getComputedStyle(e).animationPlayState')=='paused'
 page.mouse.move(0,0);page.locator('.gs-review-card').first.focus();page.wait_for_timeout(100)
 assert tracks.first.evaluate('(e)=>getComputedStyle(e).animationPlayState')=='paused'
 page.keyboard.press('Enter');assert page.locator('.gs-review-dialog').is_visible();page.keyboard.press('Escape')
 page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(200)
 assert tracks.first.evaluate('(e)=>getComputedStyle(e).animationName')=='none'
 assert page.get_by_role('button',name='Без автосмены').is_disabled()
 print('PASS real-time autoplay, explicit pause, opposite review directions, hover/focus pause, keyboard modal, live reduced-motion preference',flush=True)
 b.close()
