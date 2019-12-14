ymaps.ready(init);

function init() {
    var map = new ymaps.Map('map', {
        center: [55.650625, 37.62708],
        controls: ['zoomControl'],
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });

    const customItemContentLayout = ymaps.templateLayoutFactory.createClass([
        '<h2 class=balloon_header>{{ properties.reviews[0].place }}</h2>',
        '<div class=balloon_body>',
        '<p><a class="link-to-balloon"  href="#">{{ properties.address }}</a></p>',
        '<p>{{ properties.reviews[0].message }}</p>',
        '</div>',
        '<div class=balloon_footer>{{ properties.reviews[0].date }}</div>'
    ].join(''));

    const BalloonContentLayout = ymaps.templateLayoutFactory.createClass([
        '<div id="reviews" class="reviews">',
        '{% if (!reviews.length)  %}',
        '<p id="empty">Отзывов пока нет</p>',
        '{% endif %}',
        '{% for review in reviews %}',
        '<div class="reviews-item">',
        '<div><b>{{ review.name }}</b> <span class="place">{{ review.place }}</span> <span class="time">{{ review.date }}<span></div>',
        '<p>{{ review.message }}</p>',
        '</div>',
        '{% endfor %}',
        '</div>',
    ].join(''));

    const BalloonLayout = ymaps.templateLayoutFactory.createClass([
        '<div class="balloon">',
        '<button class="close"></button>',
        '<div class="head">',
        '<span class="address">{{ address }}</span>',
        '</div>',
        '$[[options.contentLayout]]',
        '<div class="review-form">',
        '<h3>Ваш отзыв</h3>',
        '<input type="text" id="name" placeholder="Ваше имя">',
        '<input type="text" id="place" placeholder="Укажите место">',
        '<textarea id="message" placeholder="Поделитесь впечатлениями"></textarea>',
        '<div class="action"><button id="add-review">Добавить</button></div>',
        '</div>',
        '</div>',
    ].join(''), {
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
            // console.log(this.getData());
            // console.log(this.getParameters());
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

        // console.log('click');
        if (!map.balloon.isOpen()) {
            coords = e.get('coords');

            map.balloon.open(coords, {}, {
                layout: BalloonLayout,
                contentLayout: BalloonContentLayout
            });

            getAddress(coords);

        } else {

            map.balloon.close();
        }
    });

    document.addEventListener('click', function (e) {
        // console.log(map.balloon.getPosition());
        if (e.target.tagName === 'BUTTON' && e.target.id === 'add-review') {
            const reviews = document.querySelector('#reviews');
            const empty = document.querySelector('#empty');
            const name = document.querySelector('#name');
            const place = document.querySelector('#place');
            const message = document.querySelector('#message');

            if (empty) {
                empty.remove();
            }

            const props = {
                reviews: [{
                    name: name.value,
                    place: place.value,
                    message: message.value,
                    date: getDate(),
                }],
                address: map.balloon.getData().address
            };

            reviews.append(newReviewItem(props));

            const placemark = new ymaps.Placemark(coords, props, {
                iconLayout: 'default#image',
                iconImageHref: '/src/img/mark.png',
                iconImageSize: [24, 36],
                iconImageOffset: [-12, -36]
            });

            clusterer.add(placemark);

            name.value = '';
            place.value = '';
            message.value = '';
        }

        if (e.target.tagName === 'A' && e.target.classList.contains('link-to-balloon')) {

            let reviews = clusterPlacemark.getGeoObjects().map(obj => obj.properties.get('reviews')[0]);

            map.balloon.close();

            map.balloon.open(clusterPlacemark.geometry.getCoordinates(), {
                reviews: reviews
            }, {
                layout: BalloonLayout,
                contentLayout: BalloonContentLayout
            });
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
                // console.log('balloonopen');
                coords = target.geometry.getCoordinates();
            }
            if (type === 'mouseenter') {
                target.options.set('iconImageHref', '/src/img/mark-act.png');
            }
            if (type === 'mouseleave' || type === 'balloonclose') {
                target.options.set('iconImageHref', '/src/img/mark.png');
            }
            if (type === 'click') {
                // console.log('clusterer click');
                coords = target.geometry.getCoordinates();
                map.balloon.open(target.geometry.getCoordinates(), target.properties.getAll(), {
                    layout: BalloonLayout,
                    contentLayout: BalloonContentLayout
                });
            }
        }
    });

    function newReviewItem(prop) {
        const { name, place, message, date } = prop.reviews[0];

        let item = document.createElement('div');

        item.classList.add('reviews-item');
        item.innerHTML = `
            <div><b>${name}</b> <span class="place">${place}</span> <span class="time">${date}<span></div>
            <p>${message}</p>
        `;

        return item;
    }

    function getDate() {
        const date = new Date();

        return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;
    }

    function getAddress(coords) {

        ymaps.geocode(coords).then(function (res) {
            const firstGeoObject = res.geoObjects.get(0);

            map.balloon.setData({ address: firstGeoObject.getAddressLine() });
        });
    }
}