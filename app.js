import 'dotenv/config'
import { books } from './Books.mjs'
import axios from 'axios'
import cheerio from 'cheerio'
import express from 'express'
const app = express()
import cors from 'cors'
app.use(cors())

const url = 'https://www.bible.com/verse-of-the-day'
const PORT = 8080
// function to get the verse shortenener
const getVerseShortener = (verse) => {
	const verseArray = verse.split(' ')
	let shortenedBook
	if (/\d/.test(verseArray[0])) {
		const formatBook = `_${verseArray[0]}${verseArray[1]}`
		shortenedBook = `${books[formatBook]}.${verseArray[2].replace(':', '.')}`
	} else {
		shortenedBook = `${books[verseArray[0]]}.${verseArray[1].replace(':', '.')}`
	}
	return shortenedBook
}

app.get('/', function (req, res) {
	res.json('Verse of the day scrapper')
})

app.get('/verse', (_req, res) => {
	axios(url)
		.then((response) => {
			const html = response.data
			const $ = cheerio.load(html)
			const articles = []

			$('.usfm ', html).each(function () {
				const title = $(this).text()
				articles.push(title)
			})
			const verse = articles[0].split('(')

			res.json(verse[0].trim())
		})
		.catch((err) => console.log(err))
})

app.get('/scripture-text', async (_req, res) => {
	let shortenedVerse
	let versions = {}
	let baseUrl = 'https://bible.com/bible/'
	let nivVersion = () => new Promise((resolve) => resolve(axios(`${baseUrl}111/${shortenedVerse}.NIV`)))
	let nltVersion = () => new Promise((resolve) => resolve(axios(`${baseUrl}116/${shortenedVerse}.NLT`)))
	let kjvVersion = () => new Promise((resolve) => resolve(axios(`${baseUrl}1/${shortenedVerse}.KJV`)))
	let esvVersion = () => new Promise((resolve) => resolve(axios(`${baseUrl}59/${shortenedVerse}.ESV`)))
	let ampVersion = () => new Promise((resolve) => resolve(axios(`${baseUrl}1588/${shortenedVerse}.AMP`)))
	try {
		let response = await axios(url)
		const html = response.data
		const $ = cheerio.load(html)
		const articles = []

		$('.usfm ', html).each(function () {
			const title = $(this).text()

			articles.push(title)
		})

		shortenedVerse = getVerseShortener(articles[0])

		Promise.all([kjvVersion(), nivVersion(), esvVersion(), nltVersion(), ampVersion()])
			.then((result) => {
				result.forEach((response, index) => {
					const html = response.data
					const $ = cheerio.load(html)

					switch (index) {
						case 0:
							versions['KJV'] = $('.f3-m ', html).text()
							break
						case 1:
							versions['NIV'] = $('.f3-m ', html).text()
							break
						case 2:
							versions['ESV'] = $('.f3-m ', html).text()
							break
						case 3:
							versions['NLT'] = $('.f3-m ', html).text()
							break
						case 4:
							versions['AMP'] = $('.f3-m ', html).text()

							break

						default:
							break
					}
				})
				res.json(versions)
			})
			.catch((err) => console.log(err))
	} catch (error) {
		console.log(error)
	}
})

app.listen(PORT, () => console.log(`server running on PORT ${process.env.PORT || PORT}`))
