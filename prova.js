var casper = require('casper').create();

casper.start(casper.cli.get(0), function() {
});

/* Casper configuration */

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
})

function getProductImage()
{
	// Get all images
	var images = document.getElementsByTagName('img'); 

	// Get sizes of all images
	
	return images;
}


// Then find all pictures
casper.then(function() {
	this.evaluate(function() {
		window.parseAds = {

			//Initialize score of all images to zero
			initializeScores: function(images, value) {

				for (var i = 0; i < images.length; i++){
					images[i].score = 0; 
				}
			},

			// Score images depending on their square size 
			scoreImagesBySquareSize: function(images, avg_square_size) {
			
				for (var i = 0; i < images.length; i++) {
					if (images[i].square_size >= avg_square_size) {
						images[i].score = images[i].square_size / avg_square_size
					}
				}
			},

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
			
			// Calculate square size of images
			setSquareSizes: function(images) {

				for (var i = 0; i < images.length; i++){
					images[i].square_size = images[i].height * images[i].width; 
				}
			},	

			// If proportions of images are likely to be a banner, penalty scores 
			penaltyBannerImages: function(images) {

				for (var i = 0; i < images.length; i++) {
					if (images[i].width > images[i].height * 5) {
						images[i].score = images[i].score * 0.5;	
					}
				}
			},

			getAverageSquareSize: function(images) {

				var n_images = images.length;
				var total_square_size = 0;
				
				for (var i = 0; i < images.length; i++) {
					total_square_size += images[i].square_size; 
				}

				return total_square_size/n_images;
			},

			// Functions related to get the logo

			// Get just the images that are in the top of the page
			prizeTopImages: function(top_limit, images) {

				for (var i=0; i < images.length; i++) {
					// If it's under top limit, remove it.
					if (images[i].getBoundingClientRect().top < top_limit) {
						images[i].score = 50 + images[i].score;
					}	
				}
			},

			prizeWithLogoInName: function(images) {

				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf("logo") > -1) {
						images[i].score = 30 + images[i].score;
					}
				}
			}, 

			prizePNG: function(images) {

				for (var i=0; i < images.length; i++) {
					if (images[i].src.indexOf(".png") > -1 || images[i].src.indexOf(".PNG") > -1) {
						images[i].score = 10 + images[i].score;
					}
				}	
			},

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

				//console.log("possible hosts are: ");
				/*for (var i = 0; i < possible_hosts.length; i++) {*/
					//console.log(possible_hosts[i]);
				/*}*/

				return possible_hosts;
			},

			getAllAnchors: function() {

				return document.getElementsByTagName('a');
			},

			//Get all images from the page
			getAllImages: function() {

				return document.getElementsByTagName('img');
			}
		};
	});

});

casper.then(function() {
	this.evaluate(function() {

		var images = parseAds.getAllImages();

		/* Get product image */ 
		/* TODO -> Remove images that are really small */
		parseAds.setSquareSizes(images);
		parseAds.initializeScores(images,0);

		var avg_square_size = parseAds.getAverageSquareSize(images);
		parseAds.scoreImagesBySquareSize(images,avg_square_size);
		parseAds.penaltyBannerImages(images);

		var biggest_image = parseAds.getImageWithBiggestScore(images,[]);
		console.log("Product image is: " + biggest_image.src);

		// Try to get the logo from anchors background
		var logos_anchors = parseAds.getAllAnchors();
		parseAds.initializeScores(logos_anchors,0);
		parseAds.scoreHrefRoot(logos_anchors);
		parseAds.prizeTopImages(150,logos_anchors);

		// Try to get the logo from images
		var logos = parseAds.getAllImages();
		parseAds.setSquareSizes(logos);
		parseAds.initializeScores(logos,0);
		parseAds.prizeTopImages(150,logos);
		parseAds.prizeWithLogoInName(logos);
		parseAds.prizePNG(logos);
		parseAds.scoreParentAnchor(logos);

		/*for (var i = 0; i < logos_anchors.length; i++) {*/
			//if (logos_anchors[i].score > 0) {
				//console.log("Score for this logo: " + logos_anchors[i].href);
				//console.log("Score: " + logos_anchors[i].score);
			//}
		/*}*/

		var best_logo = parseAds.getImageWithBiggestScore(logos,logos_anchors);

		console.log("Best logo: " + best_logo.src);

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




