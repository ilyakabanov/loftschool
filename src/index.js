ymaps.ready(init);

function init() {
    var map = new ymaps.Map('map', {
        center: [55.650625, 37.62708],
        controls: ['zoomControl'],
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });

    const ItemContentLayout = ymaps.templateLayoutFactory.createClass([
        '<div class="balloon-cluster">',
        '<h2 class=balloon-cluster__header>{{ properties.reviews[0].place }}</h2>',
        '<div class=balloon-cluster__body>',
        '<p><a class="link-to-balloon" data-placemark-id="{{ properties.placemarkId }}" href="#">{{ properties.address }}</a></p>',
        '<p>{{ properties.reviews[0].message }}</p>',
        '</div>',
        '<div class=balloon-cluster__footer>{{ properties.reviews[0].date.date }} {{ properties.reviews[0].date.time }}</div>',
        '</div>',
    ].join(''));

    const BalloonContentLayout = ymaps.templateLayoutFactory.createClass([
        '<div id="reviews" class="reviews">',
        '{% if (!reviews.length) %}',
        '<p id="empty">Отзывов пока нет</p>',
        '{% endif %}',
        '{% for review in reviews %}',
        '<div class="reviews-item">',
        '<div><b>{{ review.name }}</b> <span class="place">{{ review.place }}</span> <span class="time">{{ review.date.date }}<span></div>',
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

            this.constructor.superclass.clear.call(this);
        },
        onCloseClick: function (e) {
            e.preventDefault();

            this.events.fire('userclose');
        },
    });

    const clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: ItemContentLayout,
    });

    map.geoObjects.add(clusterer);

    let currentCoords;
    let currentPlacemark;

    if (!sessionStorage.getItem('placemarks')) {
        sessionStorage.setItem('placemarks', JSON.stringify([]));
    } else {

        const placemarks = JSON.parse(sessionStorage.getItem('placemarks'));

        clusterer.add(placemarks.map(placemark => newPlacemark(placemark.coords, placemark.props)));
    }

    map.events.add('click', function (e) {

        if (!map.balloon.isOpen()) {
            currentCoords = e.get('coords');

            openBalloon(currentCoords);

            getAddress(currentCoords);

        } else {

            map.balloon.close();
        }
    });

    document.addEventListener('click', function (e) {

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
                address: map.balloon.getData().address,
                placemarkId: clusterer.getGeoObjects().length
            };

            let placemarks = JSON.parse(sessionStorage.getItem('placemarks'));

            placemarks.push({ props: props, coords: currentCoords });
            sessionStorage.setItem('placemarks', JSON.stringify(placemarks));

            reviews.append(newReviewItem(props));

            clusterer.add(newPlacemark(currentCoords, props));

            name.value = '';
            place.value = '';
            message.value = '';
        }

        if (e.target.tagName === 'A' && e.target.classList.contains('link-to-balloon')) {

            let reviews = currentPlacemark.getGeoObjects().map(obj => obj.properties.get('reviews')[0]);

            let placemarkId = parseInt(e.target.dataset.placemarkId);

            let [ placemarkObj ] = currentPlacemark.getGeoObjects().filter(obj => obj.properties.get('placemarkId') === placemarkId);

            currentCoords = placemarkObj.geometry.getCoordinates();

            map.balloon.close();

            openBalloon(currentCoords, {
                reviews: reviews,
                address: e.target.innerText,
            });
        }
    });

    clusterer.events.add(['click', 'mouseenter', 'mouseleave'], function (e) {
        let target = e.get('target'),
            type = e.get('type');

        if (type === 'click') {
            currentCoords = target.geometry.getCoordinates();
            currentPlacemark = target;
        }

        if (typeof target.getGeoObjects === 'undefined') {
            // Событие произошло на геообъекте.
            if (type === 'mouseenter') {
                target.options.set('iconImageHref', '/src/img/mark-act.png');
            }
            if (type === 'mouseleave') {
                target.options.set('iconImageHref', '/src/img/mark.png');
            }
            if (type === 'click') {
                openBalloon(target.geometry.getCoordinates(), target.properties.getAll());
            }
        }
    });

    function openBalloon(coords, props = {}) {

        map.balloon.open(coords, props, {
            layout: BalloonLayout,
            contentLayout: BalloonContentLayout
        });
    }

    function newReviewItem(props) {
        const { name, place, message, date: { date } } = props.reviews[0];

        let item = document.createElement('div');

        item.classList.add('reviews-item');
        item.innerHTML = `
            <div><b>${name}</b> <span class="place">${place}</span> <span class="time">${date}<span></div>
            <p>${message}</p>
        `;

        return item;
    }

    function newPlacemark(coords, props) {

        return new ymaps.Placemark(coords, props, {
            iconLayout: 'default#image',
            iconImageHref: '/src/img/mark.png',
            iconImageSize: [24, 36],
            iconImageOffset: [-12, -36]
        });
    }

    function getDate() {
        const date = new Date();

        let dayOfMonth = date.getDate();
        let month = date.getMonth() + 1;
        let hour = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();

        if (month < 10) {
            month = '0' + month;
        }
        if (hour < 10) {
            hour = '0' + hour;
        }
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        return {
            date: `${dayOfMonth}.${month}.${date.getFullYear()}`,
            time: `${hour}:${minutes}:${seconds}`,
        };
    }

    function getAddress(coords) {

        ymaps.geocode(coords).then(function (res) {
            const firstGeoObject = res.geoObjects.get(0);

            map.balloon.setData({
                address: firstGeoObject.getAddressLine()
            });
        });
    }
}