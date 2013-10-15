var casper = require('casper').create();

var fs = require('fs');
var file_h = fs.open('urls_list.txt', 'r');
var line = file_h.readLine();

while (line) {
	line = file_h.readLine(); 
}
file_h.close();

console.log(line);

/* Casper configuration */
casper.start(casper.cli.get(0), function() {
});

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
})


casper.then(function() {

	this.evaluate(function() {

		// Create namespace
		window.parseAds = {

			/** 
			 * Initialize score attributes of images to a value 
			 * @param {NodeList} images
			 * @param {Number} value
			 */
			initializeScores: function(images, value) {

				for (var i = 0; i < images.length; i++){
					images[i].score = 0; 
				}
			},

			/**
			 * Return the image which has a biggest square size attribute
			 * @param {NodeList} images
			 * @return {Node}
			 */

			getBiggestSquareSizeImage: function(images) {

				var biggest_square_size_image = images[0];

				for (var i = 1; i < images.length; i++) {
					if (images[i].square_size > biggest_square_size_image.square_size) {
						biggest_square_size_image = images[i];
					}
				}

				return biggest_square_size_image;
			},

			/**
			 * Score images in comparison to the biggest square size image
			 * @param {NodeList} images
			 * @param {Number} max_points: how important is the square size for the overall score?
			 */
			scoreToBiggestSquareSizeImage: function(images, biggest_square_size, max_points) {
				
				for (var i=0; i < images.length; i++) {
					if (images[i].square_size > 0) {
						images[i].score = images[i].score + (images[i].square_size / biggest_square_size) * max_points; 
					}
				}
			},

			/**
			 * Score images depending on their squareness
			 * @param {NodeList} images
			 * @param {Number} max_points: how important is squareness for the overall score?
			 */

			scoreToSquareness: function(images, max_points) {

				for (var i=0; i < images.length; i++) {
					if (images[i].square_size > 0) {
						if (images[i].height > images[i].width) {
							images[i].score = images[i].score + (images[i].width / images[i].height) * max_points; 
						} else {
							images[i].score = images[i].score + (images[i].height / images[i].width) * max_points; 
						}
					}
				}
			},

			/**
			 * Return image which score attribute is bigger than the rest
			 * Two NodeList are given, one of <img> elements, and another one of <a>
			 * @param {NodeList} images
			 * @param {NodeList} anchor_images
			 * @return {Node} 
			 */
			getImageWithBiggestScore: function(images,anchor_images) {

				var best_scored_image = images[0];

				for (var i = 1; i < images.length; i++) {
					if (images[i].score > best_scored_image.score) {
						best_scored_image = images[i];
					}
				}

				for (var i = 0; i < anchor_images.length; i++) {
					if (anchor_images[i].score > best_scored_image.score) {
						best_scored_image = anchor_images[i];
					}
				}

				return best_scored_image;
			},
			
			/**
			 * Set square_size attribute for all images (width*height)
			 * @param {NodeList} images
			 */
			setSquareSizes: function(images) {

				for (var i = 0; i < images.length; i++){
					images[i].square_size = images[i].height * images[i].width; 
				}
			},	

			/**
			 * Reduce score by half if the image is likely to be a banner
			 * @param {NodeList} images
			 */
			penaltyBannerImages: function(images) {

				for (var i = 0; i < images.length; i++) {
					if (images[i].width > images[i].height * 5) {
						images[i].score = images[i].score * 0.5;	
					}
				}
			},

			/**
			 * Score up images that are in the top half size of the page
			 * @param {NodeList} images
			 */
			prizeUpperImages: function(images) {
				var client_height = document.documentElement.clientHeight;

				for (var i = 0; i < images.length; i++) {
					if (images[i].getBoundingClientRect().top > client_height*0,5) {
						images[i].score = images[i].score + 50;
					}
				}
			},

			/**
			 * Calculate average square size of all <img> elements in the page
			 * @param {NodeList} images
			 * @return {Number}
			 */
			getAverageSquareSize: function(images) {

				var n_images = images.length;
				var total_square_size = 0;
				
				for (var i = 0; i < images.length; i++) {
					total_square_size += images[i].square_size; 
				}

				return total_square_size/n_images;
			},

			/**
			 * Score up the images that are likely to be on the very top of the page (likely to be a logo)
			 * @param {NodeList} images
			 * @param {Number} top_limit
			 */
			prizeTopImages: function(top_limit, images) {

				for (var i=0; i < images.length; i++) {
					// If it's under top limit, remove it.
					if (images[i].getBoundingClientRect().top < top_limit) {
						images[i].score = 50 + images[i].score;
					}	
				}
			},

			/**
			 * Score up the images that contain the word logo in their src 
			 * @param {NodeList} images
			 */
			prizeWithLogoInName: function(images) {

				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf("logo") > -1) {
						images[i].score = 30 + images[i].score;
					}
				}
			}, 

			/**
			 * Score up the images that are in PNG format (logos usually have that format) 
			 * @param {NodeList} images
			 */
			prizePNG: function(images) {

				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf(".png") > -1 || images[i].src.indexOf(".PNG") > -1) {
						images[i].score = 10 + images[i].score;
					}
				}	
			},

			/**
			 * Score up the anchors that have href pointing to the root of the site 
			 * @param {NodeList} anchors
			 */
			scoreHrefRoot: function(anchors) {

				var possible_hosts = parseAds.possibleHosts();

				for (var i = 0; i < anchors.length; i++) {

					if (anchors[i].hasAttribute("href") && possible_hosts.indexOf(anchors[i].href) > -1) {

						//Check if there is a background url in this element or its parent
						parseAds.scoreBackground(anchors[i]);
					}
				}
			},


			scoreParentAnchor: function(images) {

				var possible_hosts = parseAds.possibleHosts();

				for (var i = 0; i < images.length; i++) {
					var parent_node = images[i].parentNode;
					if (parent_node.nodeName == 'A') {
						if (parent_node.hasAttribute("href") && possible_hosts.indexOf(parent_node.href) > -1) {
							images[i].score = images[i].score + 30;
						}
					}
				}
			},

			/**
			 * If the anchor or parent has a background-image, give it a good score (we already know they are pointing to the root of the site). 
			 * @param {Node} anchor
			 */
			scoreBackground: function(anchor) {

				// Look at the element itself
				if (window.getComputedStyle(anchor).getPropertyValue("background-image") !== 'none') {
					anchor.score = 200;
					anchor.src = (window.getComputedStyle(anchor).getPropertyValue("background-image")).replace('url(','').replace(')','');
				}

				// Look at the parent
				var parent_node = anchor.parentNode;
				if (parent_node.nodeName == 'DIV') {
					if (window.getComputedStyle(parent_node).getPropertyValue("background-image") !== 'none') {
						anchor.score = 150;
						anchor.src = window.getComputedStyle(parent_node).getPropertyValue("background-image").replace('url(','').replace(')','');
					}
				}

			},

			/**
			 * Returns the possible hosts with all the combinations (http,https,www...)
			 * @return {Array}
			 */
			possibleHosts: function() {

				var host = location.host; 
				var possible_hosts = [host,'/'];
				
				if (host.indexOf("www.") === -1) {
					possible_hosts.push("www." + host);
					possible_hosts.push("www." + host + '/');
					possible_hosts.push("http://www." + host);
					possible_hosts.push("http://www." + host + '/');
					possible_hosts.push("https://www." + host);
					possible_hosts.push("https://www." + host + '/');
					possible_hosts.push("http://" + host);
					possible_hosts.push("http://" + host + '/');
					possible_hosts.push("https://" + host);
					possible_hosts.push("https://" + host + '/');
				} else {
					possible_hosts.push(host.replace('www.', ''));
					possible_hosts.push(host.replace('www.', '') + '/');
					possible_hosts.push("http://" + host);
					possible_hosts.push("http://" + host + '/');
					possible_hosts.push("https://" + host);
					possible_hosts.push("https://" + host + '/');
					possible_hosts.push("http://" + host.replace('www.', ''));
					possible_hosts.push("http://" + host.replace('www.', '') + '/');
					possible_hosts.push("https://" + host.replace('www.', ''));
					possible_hosts.push("https://" + host.replace('www.', '') + '/');
				}

				return possible_hosts;
			},

			/**
			 * Get all <a> elements in the page
			 * @return {NodeList}
			 */
			getAllAnchors: function() {

				return document.getElementsByTagName('a');
			},

			/**
			 * Get all <a> elements in the page
			 * @return {NodeList}
			 */
			getAllImages: function() {

				return document.getElementsByTagName('img');
			}
		};
	});

});

casper.then(function() {
	this.evaluate(function() {

		// Get product image
		var images = parseAds.getAllImages();

		// Initialize <img> elements
		parseAds.initializeScores(images,0);
		parseAds.setSquareSizes(images);

		var biggest_square_size_image = parseAds.getBiggestSquareSizeImage(images);

		// Score images on comparison with the biggest image
		parseAds.scoreToBiggestSquareSizeImage(images, biggest_square_size_image.square_size, 10);

		// Score images depending on how square they are
		parseAds.scoreToSquareness(images,10);

		/*console.log("SCORES RESULTS");*/

		//for (var i = 0; i < images.length; i++) {
			//console.log("IMAGE SRC: " + images[i].src);
			//console.log("IMAGE SCORE: " + images[i].score);
		/*}*/

		console.log("Best Product Image would be: ");

		console.log(parseAds.getImageWithBiggestScore(images,[]).src);


		// Try to get the logo from anchors background
		/*var logos_anchors = parseAds.getAllAnchors();*/
		//parseAds.initializeScores(logos_anchors,0);
		//parseAds.scoreHrefRoot(logos_anchors);
		//parseAds.prizeTopImages(150,logos_anchors);

		//// Try to get the logo from images
		/*var logos = parseAds.getAllImages();*/
		//parseAds.setSquareSizes(logos);
		/*parseAds.initializeScores(logos,0);*/

		//parseAds.prizeTopImages(150,logos);
		//parseAds.prizeWithLogoInName(logos);
		//parseAds.prizePNG(logos);
		//parseAds.scoreParentAnchor(logos);

   //[>     for (var i = 0; i < images.length; i++) {<]
			////if (images[i].score > 0) {
				////console.log("Score for this logo: " + images[i].src);
				////console.log("Score: " + images[i].score);
			////}
		//[>}<]

		//var best_logo = parseAds.getImageWithBiggestScore(logos,logos_anchors);

		/*console.log("Best logo: " + best_logo.src);*/

	});
});


casper.run();
























/*function getParagraphText(p)*/
//{
	//return p.textContent || p.innerText || '';
/*}*/

/*function findBigParagraphs()*/
//{
	//var threeshold = 10;
	//var ps = document.getElementsByTagName('p');

	//console.log(window.getComputedStyle(ps[0]).getPropertyValue('font-size'));

	//[>for (var i = 0; i < ps.length; i++) {<]
		////if ( (window.getComputedStyle(ps[i]).getPropertyValue('font-size')) > threeshold) {
			////big_ps.push(ps[i]);
		////}
	//[>}<]

	//return 3;
/*}*/




