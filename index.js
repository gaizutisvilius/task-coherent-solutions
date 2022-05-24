/*-----------------------------------------------------------------------------------*/
/* Utils
/*-----------------------------------------------------------------------------------*/
const generateId = () => '_' + Math.random().toString(36).substring(2, 9);

/*-----------------------------------------------------------------------------------*/
/* Data
/*-----------------------------------------------------------------------------------*/
const data = [
  { id: generateId(), name: 'milk', price: 20, quantity: 1, amount: 20 },
  { id: generateId(), name: 'cheese', price: 60, quantity: 2, amount: 120 },
];

/*-----------------------------------------------------------------------------------*/
/*  State
/*-----------------------------------------------------------------------------------*/
const state = {};
window.state = state;

/*-----------------------------------------------------------------------------------*/
/* Shopping List
/*-----------------------------------------------------------------------------------*/
// ###### Model ######
class ShoppingList {
  getItems(items) {
    this.items = items;

    this.calcTotalCost();
  }

  addItem(newItem) {
    const isInList = this.items.find((item) =>
      item.name === newItem.name ? true : false
    );

    this.items = isInList
      ? this.items
      : [
          ...this.items,
          { ...newItem, amount: newItem.price * newItem.quantity },
        ];

    this.calcTotalCost();
  }

  updateItem(updatedItem) {
    this.items = this.items.map((item) =>
      item.id === updatedItem.id
        ? { ...updatedItem, amount: updatedItem.price * updatedItem.quantity }
        : item
    );

    this.calcTotalCost();
  }

  deleteItem(id) {
    this.items = this.items.filter((item) => item.id !== id);

    this.calcTotalCost();
  }

  calcTotalCost() {
    this.totalCost =
      this.items.length > 0
        ? this.items.reduce((prev, curr) => prev + curr.amount, 0)
        : 0;
  }
}

// ###### Controller ######
const init = () => {
  // Add shopping list to the global state if not already added
  if (!state.shoppingList) state.shoppingList = new ShoppingList();

  // Get items
  state.shoppingList.getItems(data);

  // Render items on UI
  renderShoppingList(state.shoppingList.items);
};

const addToShoppingList = (e) => {
  e.preventDefault();

  // Create data
  const newItem = ['name', 'price', 'quantity'].reduce((prev, curr) => {
    const value = document.getElementById(curr).value;
    document.getElementById(curr).value = '';
    return {
      id: generateId(),
      ...prev,
      [curr]: curr === 'price' || curr === 'quantity' ? Number(value) : value,
    };
  }, {});

  // Put focus on first element
  document.getElementById('name').focus();

  // Update state and UI
  state.shoppingList.addItem(newItem);
  renderShoppingList(state.shoppingList.items);
};

const deleteFromShoppingList = (el) => {
  let id = el.parentElement.parentElement.getAttribute('data-id');
  const product = el.parentElement.parentElement.firstElementChild.innerHTML;

  renderPopup(true, product);

  document.querySelector('.btn--continue').addEventListener('click', () => {
    renderPopup(false);

    // Update state and UI
    state.shoppingList.deleteItem(id);
    renderShoppingList(state.shoppingList.items);
  });
  document.querySelector('.btn--cancel').addEventListener('click', () => {
    renderPopup(false);
    id = null;
  });
};

const updateShoppingList = (el) => {
  if (el.hasAttribute('data-clicked')) {
    return;
  }

  if (el.getAttribute('id') !== 'amount') {
    // Set attrs and classes
    el.setAttribute('data-clicked', 'yes');
    el.setAttribute('data-text', el.innerHTML);
    el.parentElement.classList.add('active');

    // Create input element
    const input = document.createElement('input');
    el.getAttribute('id') === 'price' || el.getAttribute('id') === 'quantity'
      ? input.setAttribute('type', 'number')
      : input.setAttribute('type', 'text');
    input.value = el.innerHTML;
    input.onblur = function () {
      const td = input.parentElement;
      const tr = td.parentElement;
      const origText = td.getAttribute('data-text');
      const currText = this.value;

      // Change cell value if orig and curr values differ
      if (origText !== currText) {
        td.innerHTML = currText;

        // Create data
        const updatedItem = Array.from(tr.cells).reduce((prev, curr) => {
          return {
            id: curr.parentElement.getAttribute('data-id'),
            ...prev,
            [curr.getAttribute('id')]:
              curr.getAttribute('id') === 'price' ||
              curr.getAttribute('id') === 'quantity'
                ? parseInt(curr.innerHTML)
                : curr.innerHTML,
          };
        }, {});

        // Update state and UI
        state.shoppingList.updateItem(updatedItem);
        renderShoppingList(state.shoppingList.items);
      }
      // Keep old cell value if orig and curr values do not differ
      else {
        td.innerHTML = origText;
      }

      // Remove attrs and classes
      td.removeAttribute('data-clicked');
      td.removeAttribute('data-text');
      tr.classList.remove('active');
    };
    input.addEventListener('keyup', (e) => e.key === 'Enter' && input.blur());

    // Replace cell element with input element
    el.innerHTML = '';
    el.append(input);
    el.firstElementChild.select();
  }
};

// ###### View ######
const renderShoppingList = (items) => {
  // Clear table HTML
  document.getElementById('table__body').innerHTML = '';

  const cells = items.map((item) => {
    item.delete = null;

    // Create row element
    const tr = document.createElement('tr');

    // Create cells
    const tds = [];
    for (const cell in item) {
      const td = document.createElement('td');
      console.log(cell);
      td.append(
        `${
          cell === 'price' || cell === 'amount'
            ? item[cell].toFixed(2)
            : item[cell]
        }`
      );
      td.setAttribute('id', cell);
      tr.setAttribute('data-id', item.id);
      tds.push(td);
    }
    tds.shift();
    tds[
      tds.length - 1
    ].innerHTML = `<button class="btn btn--delete">Delete</button>`;

    // Append cells to row and row to table body
    tr.append(...tds);
    document.getElementById('table__body').append(tr);

    return tds;
  });

  // Append total price
  document.querySelector('.shopping-list__total-price').innerHTML =
    items.length > 0
      ? `<td colspan="${
          cells[0].length
        }">Total price: ${state.shoppingList.totalCost.toFixed(2)}</td>`
      : `<td></td>`;
};

const renderPopup = (open, product) => {
  if (open) {
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.popup').style.display = 'block';
    document.querySelector(
      '.popup__title'
    ).innerHTML = `Are you sure you want to delete ${product}?`;
  } else {
    document.querySelector('.overlay').style.display = 'none';
    document.querySelector('.popup').style.display = 'none';
  }
};

/*-----------------------------------------------------------------------------------*/
/* Events
/*-----------------------------------------------------------------------------------*/
init();

document
  .querySelector('.shopping-form')
  .addEventListener('submit', addToShoppingList);

document.getElementById('table__body').addEventListener('click', (e) => {
  const button = e.target.closest('.btn--delete');
  if (button) deleteFromShoppingList(button);
});

document.getElementById('table__body').addEventListener('dblclick', (e) => {
  const cell = e.target.closest('td');
  if (cell) updateShoppingList(cell);
});
