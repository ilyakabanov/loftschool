/* Задание со звездочкой */

import { randomNumber } from '../helper';

function randomPosition(elemSize, winWidth, winHeight) {

    return {
        top: randomNumber(0, winHeight - elemSize),
        left: randomNumber(0, winWidth - elemSize),
    }
}

function randomColor() {
    let rgbValue = [0, 0, 0].map(() => randomNumber(0, 255)).join();

    return `rgb(${rgbValue})`;
}

/*
 Создайте страницу с кнопкой.
 При нажатии на кнопку должен создаваться div со случайными размерами, цветом и позицией на экране
 Необходимо предоставить возможность перетаскивать созданные div при помощи drag and drop
 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то дабавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');

/*
 Функция должна создавать и возвращать новый div с классом draggable-div и случайными размерами/цветом/позицией
 Функция должна только создавать элемент и задвать ему случайные размер/позицию/цвет
 Функция НЕ должна добавлять элемент на страницу. На страницу элемент добавляется отдельно

 Пример:
   const newDiv = createDiv();
   homeworkContainer.appendChild(newDiv);
 */
function createDiv() {
    let div = document.createElement('div');

    const size = randomNumber(10, 150);
    const position = randomPosition(size, window.innerWidth, window.innerHeight);

    div.style.width = `${size}px`;
    div.style.height = `${size}px`;
    div.style.backgroundColor = randomColor();
    div.style.top = `${position.top}px`;
    div.style.left = `${position.left}px`;
    div.style.position = 'absolute';
    div.classList.add('draggable-div');

    return div;
}

/*
 Функция должна добавлять обработчики событий для перетаскивания элемента при помощи drag and drop

 Пример:
   const newDiv = createDiv();
   homeworkContainer.appendChild(newDiv);
   addListeners(newDiv);
 */
function addListeners(target) {
    target.addEventListener('mousedown', (event) => {

        let shiftX = event.clientX - target.getBoundingClientRect().left;
        let shiftY = event.clientY - target.getBoundingClientRect().top;

        homeworkContainer.append(target);

        document.addEventListener('mousemove', moveElement);

        target.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', moveElement);
        });

        function moveElement(event) {
            target.style.top = event.clientY - shiftY + 'px';
            target.style.left = event.clientX - shiftX + 'px';
        }
    });

}

let addDivButton = homeworkContainer.querySelector('#addDiv');

addDivButton.addEventListener('click', function() {
    // создать новый div
    const div = createDiv();

    // добавить на страницу
    homeworkContainer.appendChild(div);
    // назначить обработчики событий мыши для реализации D&D
    addListeners(div);
    // можно не назначать обработчики событий каждому div в отдельности, а использовать делегирование
    // или использовать HTML5 D&D - https://www.html5rocks.com/ru/tutorials/dnd/basics/
});

export {
    createDiv
};
