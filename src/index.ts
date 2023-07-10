import puppeteer, {
  Browser,
  Page,
  HTTPRequest,
  ElementHandle,
} from 'puppeteer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

class Company {
  url: string;
  name: string | null;
  address: string | null;
  email?: string | null;
  phones: string[];
  whatsapp: string[];

  constructor(
    url: string,
    name: string,
    address: string,
    email?: string,
    phones?: string[],
    whatsapp?: string[]
  ) {
    this.url = url;
    this.name = name;
    this.address = address;
    this.email = email;
    this.phones = phones ?? [];
    this.whatsapp = whatsapp ?? [];
  }
}

const url = 'https://www.solutudo.com.br/sp/boituva';
const search = 'restaurante';

const prisma = new PrismaClient.PrismaClient();

void (async () => {
  await prisma.$connect();

  try {
    const browser: Browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized'],
      defaultViewport: null,
    });

    const page: Page = await browser.newPage();

    await initializeAdBlock(page);

    await page.goto(url);
    await page.waitForSelector('#input-search');
    await page.type('#input-search', search, { delay: 100 });
    await Promise.all([page.waitForNavigation(), page.click('.btn-search')]);

    const xpathJoinCompany = '//li/div[1]/div[1]/a';
    const joinCompany = await page.$x(xpathJoinCompany);
    const listUrls: string[] = [];

    for (let i = 0; i < joinCompany.length; i++) {
      const linkElement = await joinCompany[i].toElement('a');
      const hrefProperty = await linkElement.getProperty('href');
      const url = hrefProperty.toString().split('JSHandle:')[1];
      listUrls.push(url);
    }

    for (let i = 0; i < listUrls.length; i++) {
      await Promise.all([
        page.waitForNavigation(),
        page.goto(listUrls[i], { timeout: 0 }),
      ]);
      const name = await getName(page);
      const address = await getAddress(page);
      const email = await getEmail(page);
      const phones = await getPhones(page);
      const whatsapp = await getWhatsapp(page);

      const companies = new Company(
        listUrls[i],
        name,
        address,
        email,
        phones,
        whatsapp
      );
      console.log(companies);

      await delay(0.3);
    }
  } catch (ex) {
    console.error(ex);
  }
})();

async function delay(timeInSeconds: number): Promise<void> {
  const timeInMs = timeInSeconds * 1000;
  await new Promise((resolve) => setTimeout(resolve, timeInMs));
}

async function initializeAdBlock(page: Page): Promise<void> {
  const hosts: Map<string, boolean> = new Map();
  const hostFile: string = fs.readFileSync('hosts.txt', 'utf8');
  const hostList: string[] = hostFile.split('\n');

  for (let i = 0; i < hostList.length; i++) {
    const frags: string[] = hostList[i].split(' ');

    if (frags.length > 1 && frags[0] === '0.0.0.0')
      hosts.set(frags[1].trim(), true);
  }

  await page.setRequestInterception(true);

  await page.on('request', (request: HTTPRequest) => {
    let domain: string | null = null;
    const frags: string[] = request.url().split('/');

    if (frags.length > 2) domain = frags[2];

    if (hosts.has(domain as string) && hosts.get(domain as string))
      void request.abort();
    else void request.continue();
  });
}

async function getName(page: Page): Promise<string> {
  const xpathName: string = '//h1';
  const getName: Array<ElementHandle<Node>> = await page.$x(xpathName);
  const name = await page.evaluate((el) => el.textContent, getName[0]);

  return name as string;
}

async function getAddress(page: Page): Promise<string> {
  const xpathAddress: string = '//*[@id="collapseAddress"]//a/text()';
  const getAddress: Array<ElementHandle<Node>> = await page.$x(xpathAddress);
  const address = await page.evaluate((el) => el.textContent, getAddress[0]);

  return address as string;
}

async function getEmail(page: Page): Promise<string> {
  const xpathEmail: string = '//*[@id="collapseEmail"]//a/text()[2]';
  const getEmail: Array<ElementHandle<Node>> = await page.$x(xpathEmail);
  const email = await page.evaluate((el) => el?.textContent, getEmail[0]);

  return email as string;
}

async function getPhones(page: Page): Promise<string[]> {
  const xpathPhone: string = '//*[@id="collapsePhone"]//span/text()';
  const getPhones: Array<ElementHandle<Node>> = await page.$x(xpathPhone);
  const listPhones: string[] = [];
  for (let i = 0; i < getPhones.length; i++) {
    const phone = await page.evaluate(
      (el) => el?.textContent?.trim(),
      getPhones[i]
    );
    if (phone) listPhones.push(phone);
  }

  return listPhones;
}

async function getWhatsapp(page: Page): Promise<string[]> {
  const xpathWhatsapp: string = '//*[@id="collapseWhats"]//a/text()';
  const getWhatsapp: Array<ElementHandle<Node>> = await page.$x(xpathWhatsapp);
  const listWhatsapp: string[] = [];
  for (let i = 0; i < xpathWhatsapp.length; i++) {
    const whatsapp = await page.evaluate(
      (el) => el?.textContent?.trim(),
      getWhatsapp[i]
    );
    if (whatsapp) listWhatsapp.push(whatsapp);
  }

  return listWhatsapp;
}
