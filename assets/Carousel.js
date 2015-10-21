/*
	TITLE: Carousel

	DESCRIPTION: Basic Carousel widget

	VERSION: 0.1.4

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
			enableSwipe: true,
			loopEndToEnd: false,
			selectorNavPrev: '.nav-prev',
			selectorNavNext: '.nav-next',
			selectorInnerTrack: '.inner-track',
			selectorPanels: 'article',
			classActiveItem: 'active',
			classNavDisabled: 'disabled',
			autoRotate: false,
			autoRotateInterval: 8000,
			maxAutoRotations: 5,
			animDuration: 0.6,
			animEasing: 'Power4.easeOut',
			selectorFocusEls: 'a, button, input, select, textarea',
			customEventName: 'CNJS:Carousel'
		}, objOptions || {});

		// element references
		this.$navPrev = this.$el.find(this.options.selectorNavPrev);
		this.$navNext = this.$el.find(this.options.selectorNavNext);
		this.$innerTrack = this.$el.find(this.options.selectorInnerTrack);
		this.$panels = this.$innerTrack.find(this.options.selectorPanels);

		// setup & properties
		this._length = this.$panels.length;
		if (this.options.initialIndex >= this._length) {this.options.initialIndex = 0;}
		this.numVisibleItems = this.options.numVisibleItems;
		this.numItemsToAnimate = this.options.numItemsToAnimate;
		this.currentIndex = this.options.initialIndex;
		this.lastIndex = this._length - this.numVisibleItems;
		this.itemWidth = this.$panels.eq(0).innerWidth();
		this.scrollAmt = this.itemWidth * -1;
		this.isAnimating = false;

		this.initDOM();

		this.bindEvents();

		$.event.trigger(this.options.customEventName + ':isInitialized', [this.$el]);

	},


/**
*	Private Methods
**/

	initDOM: function() {
		var $currentItem = this.$panels.eq(this.currentIndex);
		var trackWidth = this.itemWidth * this._length;
		var leftPos = this.scrollAmt * this.currentIndex;

		this.$el.attr({'role':'tablist'});
		this.$navPrev.attr({'role':'button', 'tabindex':'0'});
		this.$navNext.attr({'role':'button', 'tabindex':'0'});
		this.$panels.attr({'role':'tabpanel', 'tabindex':'-1'});

		// disable nav links if not enough visible items
		this.updateNav();
		if (this._length <= this.options.numVisibleItems) {
			this.$navPrev.addClass(this.options.classNavDisabled).attr({tabindex: '-1'});
			this.$navNext.addClass(this.options.classNavDisabled).attr({tabindex: '-1'});
		}

		// adjust initial position
		TweenMax.set(this.$innerTrack, {
			width: trackWidth,
			left: leftPos
		}); 

		this.deactivateItems();
		this.activateItems();

		// auto-rotate items
		if (this.options.autoRotate) {
			this.rotationInterval = this.options.autoRotateInterval;
			this.autoRotationCounter = this._length * this.options.maxAutoRotations;
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

	unbindEvents: function() {
		this.$navPrev.off('click', function(){});
		this.$navNext.off('click', function(){});
		if (this.options.enableSwipe) {
			this.$el.swipe('destroy');
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

		if (this.options.loopEndToEnd && this.currentIndex === 0) {
			this.currentIndex = this.lastIndex;
		} else {
			this.currentIndex -= this.numItemsToAnimate;
			if (this.currentIndex < 0) {this.currentIndex = 0;}
		}

		this.updateCarousel(event);

	},

	__clickNavNext: function(event) {

		if (this.options.autoRotate) {
			clearInterval(this.setAutoRotation);
			this.options.autoRotate = false;
		}

		if (this.options.loopEndToEnd && this.currentIndex === this.lastIndex) {
			this.currentIndex = 0;
		} else {
			this.currentIndex += this.numItemsToAnimate;
			if (this.currentIndex > this.lastIndex) {this.currentIndex = this.lastIndex;}
		}

		this.updateCarousel(event);

	},


/**
*	Public Methods
**/

	updateCarousel: function(event) {
		var self = this;
		var leftPos = (this.scrollAmt * this.currentIndex) + 'px';
		var $currentItem = this.$panels.eq(this.currentIndex);

		this.isAnimating = true;

		this.deactivateItems();

		this.updateNav();

		TweenMax.to(this.$innerTrack, this.options.animDuration, {
			left: leftPos,
			ease: this.options.animEasing,
			onComplete: function() {
				self.isAnimating = false;
				self.activateItems();
				if (!!event) {
					$currentItem.focus();
				}
			}
		});

		$.event.trigger(this.options.customEventName + ':carouselUpdated', [this.currentIndex]);

	},

	deactivateItems: function() {
		this.$panels.removeClass(this.options.classActiveItem).attr({tabindex: '-1'});
		this.$panels.find(this.options.selectorFocusEls).attr({tabindex: '-1'});
	},

	activateItems: function() {
		var first = this.currentIndex;
		var last = this.currentIndex + this.numVisibleItems;
		var $activeItems = this.$panels.slice(first, last);

		$activeItems.addClass(this.options.classActiveItem).attr({tabindex: '0'});
		$activeItems.find(this.options.selectorFocusEls).attr({tabindex: '0'});

	},

	updateNav: function() {

		this.$navPrev.removeClass(this.options.classNavDisabled).attr({tabindex: '0'});
		this.$navNext.removeClass(this.options.classNavDisabled).attr({tabindex: '0'});

		if (!this.options.loopEndToEnd) {

			if (this.currentIndex <= 0) {
				this.$navPrev.addClass(this.options.classNavDisabled).attr({tabindex: '-1'});
			}

			if (this.currentIndex >= this.lastIndex) {
				this.$navNext.addClass(this.options.classNavDisabled).attr({tabindex: '-1'});
			}

		}

	}

});

//uncomment to use as a browserify module
//module.exports = Carousel;
