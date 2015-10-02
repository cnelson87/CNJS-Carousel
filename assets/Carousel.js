/*
	TITLE: Carousel

	DESCRIPTION: Basic Carousel widget

	VERSION: 0.1.2

	USAGE: var myCarousel = new Carousel('Element', 'Options')
		@param {jQuery Object}
		@param {Object}

	AUTHOR: CN

	DEPENDENCIES:
		- jQuery 2.1x+
		- greensock
		- Class.js

*/

var Carousel = Class.extend({
	init: function($el, objOptions) {

		// defaults
		this.$window = $(window);
		this.$el = $el;
		this.options = $.extend({
			initialIndex: 0,
			numVisibleItems: 1,
			numItemsToAnimate: 1,
			isResponsive: true,
			enableSwipe: true,
			highlightActive: false,
			selectorNavPrev: '.nav-prev',
			selectorNavNext: '.nav-next',
			selectorInnerTrack: '.inner-track > ul',
			selectorItems: '> li',
			classActiveItem: 'active',
			classNavDisabled: 'disabled',
			autoRotate: false,
			autoRotateInterval: 8000,
			maxAutoRotations: 5,
			animDuration: 0.6,
			animEasing: 'Power4.easeOut',
			customEventPrfx: 'CNJS:Carousel'
		}, objOptions || {});

		// element references
		this.$navPrev = this.$el.find(this.options.selectorNavPrev);
		this.$navNext = this.$el.find(this.options.selectorNavNext);
		this.$innerTrack = this.$el.find(this.options.selectorInnerTrack);
		this.$items = this.$innerTrack.find(this.options.selectorItems);

		// setup & properties
		this.isAnimating = false;
		this.containerWidth = this.$el.width();
		this.lenItems = this.$items.length;
		this.itemWidth = $(this.$items[0]).width();
		this.scrollAmt = this.itemWidth * -1;
		this.isResponsive = this.options.isResponsive;
		this.numVisibleItems = this.options.numVisibleItems;
		this.numItemsToAnimate = this.options.numItemsToAnimate;
		if (this.options.initialIndex >= this.lenItems) {this.options.initialIndex = 0;}
		this.currentIndex = this.options.initialIndex;
		this.lastIndex = this.lenItems - this.numVisibleItems;

		if (this.isResponsive) {
			this.initResponsiveDOM();
		} else {
			this.initDOM();
		}

		this.bindEvents();

		$.event.trigger(this.options.customEventPrfx + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $currentItem = $(this.$items[this.currentIndex]);
		var trackWidth = this.itemWidth * this.lenItems;
		var leftPos = this.scrollAmt * this.currentIndex;

		// disable nav links if not enough visible items
		this.updateNav();
		if (this.lenItems <= this.options.numVisibleItems) {
			this.$navPrev.addClass(this.options.classNavDisabled);
			this.$navNext.addClass(this.options.classNavDisabled);
		}

		// adjust initial position
		TweenMax.set(this.$innerTrack, {
			left: leftPos
		}); 

		if (this.options.highlightActive) {
			$currentItem.addClass(this.options.classActiveItem);
		}

		// auto-rotate items
		if (this.options.autoRotate) {
			this.rotationInterval = this.options.autoRotateInterval;
			this.autoRotationCounter = this.lenItems * this.options.maxAutoRotations;
			this.setAutoRotation = setInterval(function() {
				this.autoRotation();
			}.bind(this), this.rotationInterval);
		}

	},

	initResponsiveDOM: function() {
		var $currentItem = $(this.$items[this.currentIndex]);
		var trackWidth = (1 / this.numVisibleItems) * (this.lenItems * 100);
		var leftPos;

		this.itemWidth = 100 / this.lenItems;

		this.scrollAmt = (100 / this.numVisibleItems) * -1;

		leftPos = this.scrollAmt * this.currentIndex;

		// disable nav links if not enough visible items
		this.updateNav();
		if (this.lenItems <= this.options.numVisibleItems) {
			this.$navPrev.addClass(this.options.classNavDisabled);
			this.$navNext.addClass(this.options.classNavDisabled);
		}

		// adjust initial position
		this.$items.css({width: this.itemWidth+'%'});
		TweenMax.set(this.$innerTrack, {
			width: trackWidth+'%',
			left: leftPos+'%'
		}); 

		if (this.options.highlightActive) {
			$currentItem.addClass(this.options.classActiveItem);
		}

		// auto-rotate items
		if (this.options.autoRotate) {
			this.rotationInterval = this.options.autoRotateInterval;
			this.autoRotationCounter = this.lenItems * this.options.maxAutoRotations;
			this.setAutoRotation = setInterval(function() {
				this.autoRotation();
			}.bind(this), this.rotationInterval);
		}

	},

	bindEvents: function() {
		var self = this;

		this.$navPrev.on('click', function(event) {
			event.preventDefault();
			if (!this.$navPrev.hasClass(this.options.classNavDisabled) && !this.isAnimating) {
				this.__clickNavPrev(event);
			}
		}.bind(this));

		this.$navNext.on('click', function(event) {
			event.preventDefault();
			if (!this.$navNext.hasClass(this.options.classNavDisabled) && !this.isAnimating) {
				this.__clickNavNext(event);
			}
		}.bind(this));

		if (this.options.enableSwipe) {
			this.$el.swipe({
				fingers: 'all',
				excludedElements: '.noSwipe',
				threshold: 50,
				triggerOnTouchEnd: false, // triggers on threshold
				swipeLeft: function(event) {
					if (!self.$navNext.hasClass(self.options.classNavDisabled) && !self.isAnimating) {
						self.__clickNavNext(event);
					}
				},
				swipeRight: function(event) {
					if (!self.$navPrev.hasClass(self.options.classNavDisabled) && !self.isAnimating) {
						self.__clickNavPrev(event);
					}
				},
				allowPageScroll: 'vertical'
			});
		}

	},

	autoRotation: function() {

		if (this.currentIndex === this.lastIndex) {
			this.currentIndex = 0;
		} else {
			this.currentIndex += this.numItemsToAnimate;
			if (this.currentIndex > this.lastIndex) {this.currentIndex = this.lastIndex;}
		}

		this.updateCarousel();
		this.autoRotationCounter--;

		if (this.autoRotationCounter === 0) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

	},


/**
*	Event Handlers
**/

	__clickNavPrev: function(event) {

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		this.currentIndex -= this.numItemsToAnimate;
		if (this.currentIndex < 0) {this.currentIndex = 0;}

		this.updateCarousel();

	},

	__clickNavNext: function(event) {

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		this.currentIndex += this.numItemsToAnimate;
		if (this.currentIndex > this.lastIndex) {this.currentIndex = this.lastIndex;}

		this.updateCarousel();

	},


/**
*	Public Methods
**/

	updateCarousel: function() {
		var self = this;
		var unit = this.isResponsive ? '%' : 'px';
		var leftPos = (this.scrollAmt * this.currentIndex) + unit;
		var $currentItem = $(this.$items[this.currentIndex]);

		this.isAnimating = true;

		if (this.options.highlightActive) {
			this.$items.removeClass(this.options.classActiveItem);
		}

		this.updateNav();

		TweenMax.to(this.$innerTrack, this.options.animDuration, {
			left: leftPos,
			ease: this.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				if (self.options.highlightActive) {
					$currentItem.addClass(self.options.classActiveItem);
				}
			}
		});

		$.event.trigger(this.options.customEventPrfx + ':carouselUpdated', [this.currentIndex]);

	},

	updateNav: function() {

		this.$navPrev.removeClass(this.options.classNavDisabled);
		this.$navNext.removeClass(this.options.classNavDisabled);

		if (this.currentIndex <= 0) {
			this.$navPrev.addClass(this.options.classNavDisabled);
		}

		if (this.currentIndex >= this.lastIndex) {
			this.$navNext.addClass(this.options.classNavDisabled);
		}

	}

});

//uncomment to use as a browserify module
//module.exports = Carousel;
