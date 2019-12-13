ymaps.ready(init);

function init() {
    var map = new ymaps.Map('map', {
        center: [55.650625, 37.62708],
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });

    const BalloonContentLayout = ymaps.templateLayoutFactory.createClass([
        '<div class="balloon">',
        '<button class="close"></button>',
        '<div class="head">',
        '<span class="address">Невский пр., 78, Санкт-Петербург, 191025</span>',
        '</div>',
        '<div id="reviews" class="reviews">',
        '<div class="reviews-item">',
        '<div><b>{{ properties.name }}</b> <span class="place">{{ properties.place }}</span> <span class="time">11.12.2019<span></div>',
        '<p>{{ properties.message }}</p>',
        '</div>',
        '</div>',
        '<div class="review-form">',
        '<h3>Ваш отзыв</h3>',
        '<input type="text" id="name" placeholder="Ваше имя">',
        '<input type="text" id="place" placeholder="Укажите место">',
        '<textarea id="message" placeholder="Поделитесь впечатлениями"></textarea>',
        '<div class="action"><button id="add-review">Добавить</button></div>',
        '</div>',
        '</div>',
    ].join(''));

    const customItemContentLayout = ymaps.templateLayoutFactory.createClass([
        '<h2 class=balloon_header>{{ properties.place|raw }}</h2>',
        '<div class=balloon_body>',
        '<p><a class="link-to-balloon" data-pid="{{ properties.placemarkId }}" href="#">test</a></p>',
        '<p>{{ properties.message|raw }}</p>',
        '</div>',
        '<div class=balloon_footer>!!!!!13.12.2019</div>'
    ].join(''));

    var customBalloonContentLayout = ymaps.templateLayoutFactory.createClass([
        '<div class="balloon">',
        '<button class="close"></button>',
        '<div id="reviews" class="reviews">',
        '{% for geoObject in properties.geoObjects %}',
        '<div class="reviews-item">',
        '<div><b>{{ geoObject.properties.name }}</b> <span class="place">{{ geoObject.properties.place }}</span> <span class="time">11.12.2019<span></div>',
        '<p>{{ geoObject.properties.message }}</p>',
        '</div>',
        '{% endfor %}',
        '</div>',
        '<div class="review-form">',
        '<h3>Ваш отзыв</h3>',
        '<input type="text" id="name" placeholder="Ваше имя">',
        '<input type="text" id="place" placeholder="Укажите место">',
        '<textarea id="message" placeholder="Поделитесь впечатлениями"></textarea>',
        '<div class="action"><button id="add-review">Добавить</button></div>',
        '</div>',
        '</div>',
    ].join(''));

    const BalloonLayout = ymaps.templateLayoutFactory.createClass(
        '$[[options.contentLayout observeSize minWidth=370px maxWidth=370px]]', {
            build: function () {
                this.constructor.superclass.build.call(this);

                let close = document.querySelector('.close');

                close.addEventListener('click', this.onCloseClick.bind(this));
            },
            clear: function () {

                // let close = document.querySelector('.close');
                //
                // close.removeEventListener('click', this.onCloseClick);

                this.constructor.superclass.clear.call(this);
            },
            onCloseClick: function (e) {
                e.preventDefault();

                this.events.fire('userclose');
            },
        });

    const clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        groupByCoordinates: true,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
    });

    map.geoObjects.add(clusterer);

    let coords;
    let clusterPlacemark;

    map.events.add('click', function (e) {
        if (!map.balloon.isOpen()) {
            coords = e.get('coords');

            map.balloon.open(coords, {}, {
                layout: BalloonLayout,
                contentLayout: BalloonContentLayout
            });

        } else {

            map.balloon.close();
        }
    });

    // console.log(map);
    document.addEventListener('click', function (e) {
        // console.log(map.balloon.getPosition());
        if (e.target.tagName === 'BUTTON' && e.target.id === 'add-review') {
            const name = document.querySelector('#name');
            const place = document.querySelector('#place');
            const message = document.querySelector('#message');

            const p = new ymaps.Placemark(coords, {
                name: name.value,
                place: place.value,
                message: message.value
            }, {
                iconLayout: 'default#image',
                iconImageHref: '/src/img/mark.png',
                iconImageSize: [24, 36],
                iconImageOffset: [-12, -36],
                balloonLayout: BalloonLayout,
                balloonContentLayout: BalloonContentLayout,
                hideIconOnBalloonOpen: true,
            });

            clusterer.add(p);

        }

        if (e.target.tagName === 'A' && e.target.classList.contains('link-to-balloon')) {
            // debugger
            if (clusterPlacemark.options) {
                clusterPlacemark.options.set('clusterBalloonContentLayout', customBalloonContentLayout);
            }
        }
    });

    clusterer.events.add(['click', 'mouseenter', 'mouseleave', 'balloonopen', 'balloonclose'], function (e) {
        let target = e.get('target'),
            type = e.get('type');

        if (typeof target.getGeoObjects !== 'undefined') {
            // Событие произошло на кластере.
            if (type === 'click') {
                clusterPlacemark = e.get('target');
            }
            if (type === 'balloonopen') {
                coords = clusterPlacemark.geometry.getCoordinates();
            }
            if (type === 'balloonclose') {
                clusterPlacemark.options.unset('clusterBalloonContentLayout');
            }
        } else {
            // Событие произошло на геообъекте.
            if (type === 'balloonopen') {
                coords = target.geometry.getCoordinates();
            }
            if (type === 'mouseenter') {
                target.options.set('iconImageHref', '/src/img/mark-act.png');
            }
            if (type === 'mouseleave' || type === 'balloonclose') {
                target.options.set('iconImageHref', '/src/img/mark.png');
            }
        }
    });

}