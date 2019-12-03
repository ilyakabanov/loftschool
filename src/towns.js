/*
 Страница должна предварительно загрузить список городов из
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 и отсортировать в алфавитном порядке.

 При вводе в текстовое поле, под ним должен появляться список тех городов,
 в названии которых, хотя бы частично, есть введенное значение.
 Регистр символов учитываться не должен, то есть "Moscow" и "moscow" - одинаковые названия.

 Во время загрузки городов, на странице должна быть надпись "Загрузка..."
 После окончания загрузки городов, надпись исчезает и появляется текстовое поле.

 Разметку смотрите в файле towns-content.hbs

 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер

 *** Часть со звездочкой ***
 Если загрузка городов не удалась (например, отключился интернет или сервер вернул ошибку),
 то необходимо показать надпись "Не удалось загрузить города" и кнопку "Повторить".
 При клике на кнопку, процесс загрузки повторяется заново
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');

/*
 Функция должна вернуть Promise, который должен быть разрешен с массивом городов в качестве значения

 Массив городов пожно получить отправив асинхронный запрос по адресу
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 */
function loadTowns() {
    return fetch('https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json')
        .then(response => {
            if (response.status >= 400) {
                return Promise.reject();
            }

            return response.json();
        }).then(towns => {

            return towns.sort((a, b) => {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }

                return 0;
            });
        });
}

/*
 Функция должна проверять встречается ли подстрока chunk в строке full
 Проверка должна происходить без учета регистра символов

 Пример:
   isMatching('Moscow', 'moscow') // true
   isMatching('Moscow', 'mosc') // true
   isMatching('Moscow', 'cow') // true
   isMatching('Moscow', 'SCO') // true
   isMatching('Moscow', 'Moscov') // false
 */
function isMatching(full, chunk) {
    if (chunk) {
        return (full.toLocaleLowerCase()).includes(chunk.toLocaleLowerCase());
    }

    return false;
}

/* Блок с надписью "Загрузка" */
const loadingBlock = homeworkContainer.querySelector('#loading-block');
/* Блок с текстовым полем и результатом поиска */
const filterBlock = homeworkContainer.querySelector('#filter-block');
/* Текстовое поле для поиска по городам */
const filterInput = homeworkContainer.querySelector('#filter-input');
/* Блок с результатами поиска */
const filterResult = homeworkContainer.querySelector('#filter-result');
/* Блок с ошибкой */
const errorBlock = homeworkContainer.querySelector('#error-block');
/* Кнопка повторить загрузку */
const repeatLoading = homeworkContainer.querySelector('#repeat-loading');

function initTownSearch() {
    loadTowns().then(response => {
        errorBlock.style.display = 'none';
        loadingBlock.style.display = 'none';
        filterBlock.style.display = 'block';

        filterInput.addEventListener('keyup', (e) => {
            filterResult.innerHTML = '';
            let fragment = document.createDocumentFragment();

            response.forEach(town => {
                if (!isMatching(town.name, e.target.value)) {
                    return;
                }

                let li = document.createElement('div');

                li.innerText = town.name;
                fragment.append(li);
            });

            filterResult.append(fragment);
        });
    }).catch(() => {
        loadingBlock.style.display = 'none';
        errorBlock.style.display = 'block';
        repeatLoading.addEventListener('click', initTownSearch);
    });
}

initTownSearch();

export {
    loadTowns,
    isMatching
};
