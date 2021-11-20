document.addEventListener('DOMContentLoaded', () => {

  let clientsToRender = [];
  let sortType = 'id';
  let timeoutID;

  const containerClients = document.querySelector('.clients__container');
  const tableLoading = document.querySelector('.table__loading');

  const btnNewClient = document.querySelector('.btn-new-client');
  btnNewClient.addEventListener('click', () => {
    createForm(containerClients, 'form-new', false, 'Новый клиент', 'Сохранить', 'Отмена', handlers);
  });

  const tableHead = document.querySelector('.table__head');
  tableHead.addEventListener('click', function(e) {
    if (e.target.classList.contains('table__heading-btn')) {
      sortType = e.target.dataset.type;
      sortClientList();
    };
  });

  const search = document.querySelector('.search__input');
  search.addEventListener('input', () => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(searchClientElem, 300);
  });

  // методы работы с сервером
  const handlers = {
    addClient (data, formCloseFunction, errorFunction, loading) {
      loading(true);
      fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          surname: data.surname,
          lastName: data.lastName,
          contacts: data.contacts,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then (response => {
          if (!response.ok) {
            errorFunction(response);
            loading(false);
            return
          };
          getClientsList()
            .then(() => {
              sortClientList(true);
              renderClientList();
              formCloseFunction();
            });
        });
    },
    async getClient (idClient) {
      let response = await fetch(`http://localhost:3000/api/clients/${idClient}`)
      let client = await response.json();
      return client
    },
    editClient (data, idClient, formCloseFunction, errorFunction, loading) {
      loading(true);
      fetch(`http://localhost:3000/api/clients/${idClient}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          surname: data.surname,
          lastName: data.lastName,
          contacts: data.contacts,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            getClientsList()
              .then (() => {
                sortClientList(true);
                renderClientList();
                formCloseFunction();
              });
          } else {
            errorFunction(response);
            loading(false);
          };
      });
    },
    deleteClient (idClient, clientElem, formCloseFunction, errorFunction, loading) {
      loading(true);
      fetch(`http://localhost:3000/api/clients/${idClient}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (response.ok) {
            clientElem.remove();
            formCloseFunction();
            getClientsList()
              .then (() => {
                sortClientList(true);
                renderClientList();
              });
          } else {
            errorFunction(response);
            loading(false);
          };
        });
    },
  };

  // первоначальная загрузка таблицы
  getClientsList()
    .then (() => {
      sortClientList();
      renderClientList();
    });

  // переход к карточке клиента через ссылку с hash-частью
  if (location.hash.length > 0) {
    createForm(containerClients, 'form-edit', true, 'Изменить данные', 'Сохранить', 'Удалить клиента', handlers, location.hash.slice(1,));
  }
  window.addEventListener("hashchange", function() {
    createForm(containerClients, 'form-edit', true, 'Изменить данные', 'Сохранить', 'Удалить клиента', handlers, location.hash.slice(1,));
  });

  // получение списка клиентов с сервера
  async function getClientsList () {
    tableLoading.classList.add('table__loading_active');
    const response = await fetch('http://localhost:3000/api/clients');
    if (response.status !== 200) {
      tableLoading.textContent = 'Cервер недоступен'
    }
    clientsToRender = await response.json();
  };

  // отрисовка клиентов в таблице
  function renderClientList () {
    clearTable();
    clientsToRender.forEach(client => {
      createClientElement(client);
    });
    tableLoading.classList.remove('table__loading_active');

    // полная очистка таблицы
    function clearTable() {
      document.querySelectorAll('.table__row').forEach((elem) => {
        elem.remove();
      });
    };
  };

  // сортировка
  function sortClientList (noChoiseClass) {
    const btnSort = document.querySelector(`[data-type="${sortType}"]`);
    choiseClassBtn();

    // определение типов данных и сортировки
    if (sortType === 'fullname') {
      if (btnSort.classList.contains('sort-ascending')) {
        clientsToRender.sort(sortByFullname('surname', 'name', 'middleName', 'По возрастанию'));
      } else {
        clientsToRender.sort(sortByFullname('surname', 'name', 'middleName', 'По убыванию'));
      };
    } else {
        if (btnSort.classList.contains('sort-ascending')) {
          clientsToRender.sort(sortByKey(sortType, 'По возрастанию'));
        } else {
          clientsToRender.sort(sortByKey(sortType, 'По убыванию'));
        };
    };
    tableLoading.classList.add('table__loading_active');
    renderClientList();

    // определение класса для активной кнопки сортировки
    function choiseClassBtn () {
      if (noChoiseClass) {
        return
      };
      if (btnSort.classList.contains('sort-ascending')) {
        btnSort.classList.remove('sort-ascending');
        btnSort.classList.add('sort-descending');
      } else if (btnSort.classList.contains('sort-descending')) {
        btnSort.classList.remove('sort-descending');
        btnSort.classList.add('sort-ascending');
      } else if (!btnSort.classList.contains('table__heading-btn_active')) {
        document.querySelectorAll('.table__heading-btn_active').forEach(btn => {
          btn.classList.remove('table__heading-btn_active', 'sort-ascending', 'sort-descending');
        });
        btnSort.classList.add('table__heading-btn_active', 'sort-ascending');
      };
    };
    // сортировка по типам
    function sortByFullname(surname, name, lastName, type) {
      if (type === 'По возрастанию') {
        return (a, b) => a[surname]+a[name]+a[lastName] > b[surname]+b[name]+b[lastName] ? 1 : -1;
      };
      if (type === 'По убыванию') {
        return (a, b) => a[surname]+a[name]+a[lastName] < b[surname]+b[name]+b[lastName] ? 1 : -1;
      };
    };
    function sortByKey(key, type) {
      if (type === 'По возрастанию') {
        return (a, b) => a[key] > b[key] ? 1 : -1;
      };
      if (type === 'По убыванию') {
        return (a, b) => a[key] < b[key] ? 1 : -1;
      };
    };
  };

  // поиск
  function searchClientElem () {
    const resultWrapper = document.querySelector('.search__result');

    // удаление подсветки элемента в таблице
    if (document.querySelector('.table__cell_search-result')) {
      document.querySelectorAll('.table__cell_search-result').forEach(cell => {
        cell.classList.remove('table__cell_search-result');
      });
    };

    if (search.value) {
      searchClient()
      .then (clients => {
        resultWrapper.classList.add('search__result_active');
        clearSearchList();
        fillSearchList(clients);
      });
    } else {
      resultWrapper.classList.remove('search__result_active');
      clearSearchList();
    };

    // поиск на сервере
    async function searchClient() {
      const response = await fetch(`http://localhost:3000/api/clients?search=${search.value}`);
      const clients = await response.json();
      return clients
    };
    // очистка результатов поиска
    function clearSearchList () {
      document.querySelectorAll('.search__item').forEach(item => item.remove());
    }
    // заполнение результатов поиска
    function fillSearchList (clients) {

      const list = document.querySelector('.search__list');

      if (clients.length === 0) {
        document.querySelector('.search__no-result').classList.remove('search__no-result_hidden');
        return
      };

      document.querySelector('.search__no-result').classList.add('search__no-result_hidden');

      clients.forEach((client, index)  => {

        const item = document.createElement('li');
        item.classList.add('search__item');

        const link = document.createElement('a');
        link.classList.add('search__item-link');
        link.textContent = `${client.surname} ${client.name}`
        link.href = `#${client.id}`;
        link.id = index + 1;

        link.addEventListener('click', e => {
          e.preventDefault();
          const clientElem = document.getElementById(client.id);
          search.value = '';
          resultWrapper.classList.remove('search__result_active');
          clearSearchList();
          // плавный переход
          clientElem.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // подсветка выбранного клиента
          document.querySelectorAll('.table__cell_search-result').forEach(cell => {
            cell.classList.remove('table__cell_search-result');
          });
          clientElem.querySelectorAll('.table__cell').forEach(cell => {
            cell.classList.add('table__cell_search-result');
          });
        });

        // управление между ссылками с помощью стрелок
        link.addEventListener('keydown', event => {

          const id = Number(link.id);

          if (id === 1) {
            if (event.keyCode === 38) {
              search.focus();
            };
            if (clients.length > 1 && event.keyCode === 40) {
              list.children[id].querySelector('.search__item-link').focus();
            };
          };

          if (id !== 1 && id !== clients.length) {
            if (event.keyCode === 38) {
              list.children[Number(id) - 2].querySelector('.search__item-link').focus();
            };
            if (event.keyCode === 40) {
              list.children[id].querySelector('.search__item-link').focus()
            };
          };

          if (id === clients.length && clients.length > 1 && event.keyCode === 38) {
            list.children[id - 2].querySelector('.search__item-link').focus();
          };
        });

        item.append(link);
        list.append(item);
      });

      search.addEventListener('keydown', event => {
        if (event.keyCode === 40) {
          document.querySelector('.search__item-link').focus();
        };
      });
    };

    // Предыдущая версия поиска

    // if (search.value) {
    //   searchClient()
    //   .then (() => {
    //     sortClientList(true);
    //     renderClientList();
    //   });
    // } else {
    //   getClientsList()
    //     .then (() => {
    //       sortClientList(true);
    //       renderClientList();
    //     });
    // };
    // // поиск на сервере
    // async function searchClient() {
    //   tableLoading.classList.add('table__loading_active');
    //   const response = await fetch(`http://localhost:3000/api/clients?search=${search.value}`);
    //   clientsToRender = await response.json();
    // };

  };

  // создание формы добавить/изменить/удалить
  async function createForm(container, className, disabledBtn, textHeading, textBtnPrimary, textBtnSecond, handlers, idClient, clientElem) {

    const modal = document.createElement('div');
    modal.classList.add('modal');
    function closeModal () {
      clearServerErr();
      modal.remove();
    };

    const modalBg = document.createElement('div');
    modalBg.classList.add('modal__bg');
    modalBg.addEventListener('click', () => {
      closeModal();
    });

    const form = document.createElement('form');
    form.classList.add('form', `${className}`);

    const formDisabled = document.createElement('div');
    formDisabled.classList.add('form__disabled');
    form.append(formDisabled);

    // кнопка закрыть форму
    const btnClose = document.createElement('button');
    btnClose.classList.add('btn', 'form__btn-close');
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
    form.append(btnClose);

    // заголовок
    function createFormHeading(container) {
      const heading = document.createElement('h2');
      heading.classList.add('form__heading', `${className}__heading`);
      heading.textContent = textHeading;
      container.append(heading);
    };

    if (className === 'form-new' || className === 'form-edit') {

      form.noValidate = true;

      const formUp = document.createElement('div');
      formUp.classList.add('form__up');

      // получение клиента для заполнения формы
      let client
      if (className === 'form-edit') {
        client = await handlers.getClient(idClient);
      };

      createFormHeading(formUp);

      // id клиента
      if (className === 'form-edit') {
        const idClient = document.createElement('span');
        idClient.classList.add('form__client-id');
        idClient.textContent = `ID: ${client.id}`;
        formUp.append(idClient);
      };

      const fullNameList = document.createElement('ul');
      fullNameList.classList.add('form__fullname-list');

      // создание инпутов для ФИО
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('li');
        item.classList.add('form__fullname-item', `${className}__fullname-item`);

        const label = document.createElement('label');
        label.classList.add('form__label');

        const labelHeading = document.createElement('span');
        labelHeading.classList.add('form__label-text', `${className}__label-text`);

        const inputRequired = document.createElement('span');
        inputRequired.classList.add('form__required', `${className}__required`);
        inputRequired.textContent = '*';

        const error = document.createElement('span');
        error.classList.add('form__error');

        const input = document.createElement('input');
        input.classList.add('form__input', 'form__input-fullname');
        input.type = 'text';
        input.disabled = disabledBtn;

        switch (i) {
          case 0:
            labelHeading.textContent = 'Фaмилия';
            labelHeading.append(inputRequired);
            input.classList.add('form__input-fullname_surname');
            if (className === 'form-edit') {
              input.value = client.surname;
            };
            break;
          case 1:
            labelHeading.textContent = 'Имя';
            labelHeading.append(inputRequired);
            input.classList.add('form__input-fullname_name');
            if (className === 'form-edit') {
              input.value = client.name;
            };
            break;
          case 2:
            labelHeading.textContent = 'Отчество';
            input.classList.add('form__input-fullname_lastname');
            if (className === 'form-edit') {
              input.value = client.lastName;
            };
            break;
          };

        // скрытие текста label
        if (className === 'form-new') {
          input.addEventListener('input', () => {
            labelHeading.classList.add('form-new__label-text_hidden');
            if (!input.value) {
              labelHeading.classList.remove('form-new__label-text_hidden');
            };
          });
        };

        label.append(labelHeading, error, input);
        item.append(label);
        fullNameList.append(item);
      };

      formUp.append(fullNameList);

      // создание блока для контактов
      const contacts = document.createElement('div');
      contacts.classList.add('form__contacts');

      const contactsList = document.createElement('ul');
      contactsList.classList.add('form__contacts-list');

      // создание инпута для контакта
      function createContact(typeContact = 'Телефон', value = '') {
        if (!document.querySelector('form__contacts-item')) {
          contactsList.classList.add('form__contacts-list_active');
          contacts.classList.add('form__contacts_list-active');
        };

        const contactWrapper = document.createElement('li');
        contactWrapper.classList.add('form__contacts-item');

        const select = document.createElement('select');
        select.classList.add('form__select');
        // создание вариантов селекта
        for (let i = 0; i < 6; i++) {
          const option = document.createElement('option');
          option.classList.add('form__option');

          switch (i) {
            case 0:
              option.textContent = 'Телефон';
              option.value = 'Телефон';
              break;
            case 1:
              option.textContent = 'Доп. телефон';
              option.value = 'Доп. телефон';
              break;
            case 2:
              option.textContent = 'Email';
              option.value = 'Email';
              break;
            case 3:
              option.textContent = 'Vk';
              option.value = 'Vk';
              break;
            case 4:
              option.textContent = 'Facebook';
              option.value = 'Facebook';
              break;
            case 5:
              option.textContent = 'Другое';
              option.value = 'Другое';
              break;
            };
          select.append(option);
        };
        select.value = typeContact;
        select.disabled = disabledBtn;

        const err = document.createElement('span');
        err.classList.add('form__error', 'form__input-contact-error');

        const input = document.createElement('input');
        input.classList.add('form__input', 'form__input-contact');
        input.value = value;
        input.placeholder = 'Введите данные контакта';
        input.disabled = disabledBtn;
        function choiseTypeInput () {
          switch (select.value) {
            case 'Телефон':
            case 'Доп. телефон':
              input.type = 'tel';
              const maskTel = new Inputmask("+7 (999) 999-99-99");
              maskTel.mask(input);
              break;
            case 'Vk':
            case 'Facebook':
            case 'Другое':
              input.type = 'text';
              break;
            case 'Email':
              input.type = 'email';
              break;
          };
          if (input.type !== 'tel' && input.inputmask) {
            input.inputmask.remove();
          };
        };
        choiseTypeInput();

        select.addEventListener('change', () => {
          input.value = '';
          choiseTypeInput();
        });

        const btnDelContact = document.createElement('button');
        btnDelContact.classList.add('btn', 'form__btn-delete-contact');
        btnDelContact.innerHTML = `
        <svg class="form__btn-delete-icon" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z" fill="#B0B0B0"/>
        </svg>
        `;
        btnDelContact.addEventListener('click', (e) => {
          e.preventDefault();
          contactWrapper.remove();
          if (document.querySelectorAll('.form__contacts-item').length < 10) {
            btnAddContact.classList.remove('form__btn-add-contact_hidden');
          }
          if (!document.querySelector('.form__contacts-item')) {
            contactsList.classList.remove('form__contacts-list_active');
            contacts.classList.remove('form__contacts_list-active');
          };
        });
        btnDelContact.disabled = disabledBtn;

        const btnDelContactPopup = document.createElement('span');
        btnDelContactPopup.classList.add('form__btn-delete-contact-popup');
        btnDelContactPopup.textContent = 'Удалить контакт';

        btnDelContact.append(btnDelContactPopup);
        contactWrapper.append(select, err, input, btnDelContact);
        contactsList.append(contactWrapper);
        const choices = new Choices(select, {
          position: 'bottom',
          searchEnabled: false,
          shouldSort: false,
          itemSelectText: '',
        });
      };


      if (className === 'form-edit') {
        const clientContacts = client.contacts;
        for (let contact of clientContacts) {
          createContact(contact.type, contact.value)
        };
      };

      // кнопка добавить контакт
      const btnAddContact = document.createElement('button');
      btnAddContact.classList.add('btn', 'form__btn-add-contact');
      btnAddContact.innerHTML = `
        <svg class="form__btn-add-icon-active" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M1.33331 8.00016C1.33331 4.32016 4.31998 1.3335 7.99998 1.3335C11.68 1.3335 14.6666 4.32016 14.6666 8.00016C14.6666 11.6802 11.68 14.6668 7.99998 14.6668C4.31998 14.6668 1.33331 11.6802 1.33331 8.00016ZM7.33329 5.33366C7.33329 4.96699 7.63329 4.66699 7.99996 4.66699C8.36663 4.66699 8.66663 4.96699 8.66663 5.33366V7.33366H10.6666C11.0333 7.33366 11.3333 7.63366 11.3333 8.00033C11.3333 8.36699 11.0333 8.66699 10.6666 8.66699H8.66663V10.667C8.66663 11.0337 8.36663 11.3337 7.99996 11.3337C7.63329 11.3337 7.33329 11.0337 7.33329 10.667V8.66699H5.33329C4.96663 8.66699 4.66663 8.36699 4.66663 8.00033C4.66663 7.63366 4.96663 7.33366 5.33329 7.33366H7.33329V5.33366Z" fill="#9873FF"/>
        </svg>
        <svg class="form__btn-add-icon" width="14" height="14" viewbox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.99998 3.66683C6.63331 3.66683 6.33331 3.96683 6.33331 4.3335V6.3335H4.33331C3.96665 6.3335 3.66665 6.6335 3.66665 7.00016C3.66665 7.36683 3.96665 7.66683 4.33331 7.66683H6.33331V9.66683C6.33331 10.0335 6.63331 10.3335 6.99998 10.3335C7.36665 10.3335 7.66665 10.0335 7.66665 9.66683V7.66683H9.66665C10.0333 7.66683 10.3333 7.36683 10.3333 7.00016C10.3333 6.6335 10.0333 6.3335 9.66665 6.3335H7.66665V4.3335C7.66665 3.96683 7.36665 3.66683 6.99998 3.66683ZM6.99998 0.333496C3.31998 0.333496 0.333313 3.32016 0.333313 7.00016C0.333313 10.6802 3.31998 13.6668 6.99998 13.6668C10.68 13.6668 13.6666 10.6802 13.6666 7.00016C13.6666 3.32016 10.68 0.333496 6.99998 0.333496ZM6.99998 12.3335C4.05998 12.3335 1.66665 9.94016 1.66665 7.00016C1.66665 4.06016 4.05998 1.66683 6.99998 1.66683C9.93998 1.66683 12.3333 4.06016 12.3333 7.00016C12.3333 9.94016 9.93998 12.3335 6.99998 12.3335Z" fill="#9873FF"/>
        </svg>Добавить контакт
      `;
      btnAddContact.addEventListener('click', (e) => {
        e.preventDefault();
        createContact();
        if (document.querySelectorAll('.form__contacts-item').length === 10) {
          btnAddContact.classList.add('form__btn-add-contact_hidden');
        };
      });
      btnAddContact.disabled = disabledBtn;

      contacts.append(contactsList, btnAddContact);
      form.append(formUp, contacts);
    };

    if (className === 'form-delete') {
      createFormHeading(form);

      const discr = document.createElement('p');
      discr.classList.add('form-delete__discr');
      discr.textContent = 'Вы действительно хотите удалить данного клиента?';
      form.append(discr);
    };

    const serverErr = document.createElement('span');
    serverErr.classList.add('form__server-error');
    form.append(serverErr);

    // очистка серверной ошибки
    function clearServerErr() {
      serverErr.textContent = '';
      serverErr.classList.remove('form__server-error_active');
      if (form.querySelector('.form__contacts')) {
        form.querySelector('.form__contacts').classList.remove('form__contacts_server-error-active');
      };
      if (form.querySelector('.form-delete__discr')) {
        form.querySelector('.form-delete__discr').classList.remove('form-delete__discr_server-error-active');
      };
    };
    // получение ошибки
    function serverError (response) {
      serverErr.classList.add('form__server-error_active');
      serverErr.textContent = `${response.status} ${response.statusText}`;
      if (form.querySelector('.form__contacts')) {
        form.querySelector('.form__contacts').classList.add('form__contacts_server-error-active');
      };
      if (form.querySelector('.form-delete__discr')) {
        form.querySelector('.form-delete__discr').classList.add('form-delete__discr_server-error-active');
      };
    };

    // создание кнопки сохранить/удалить
    function createBtnPrimary () {
      const btnPrimary = document.createElement('button');
      btnPrimary.classList.add('btn', 'btn-primary', 'btn-primary_save');
      btnPrimary.innerHTML = `
        <svg class="btn-primary-loading-icon"  width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.00008 8.03996C3.00008 10.8234 5.2566 13.08 8.04008 13.08C10.8236 13.08 13.0801 10.8234 13.0801 8.03996C13.0801 5.25648 10.8236 2.99996 8.04008 2.99996C7.38922 2.99996 6.7672 3.1233 6.196 3.348" stroke="#B89EFF" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round"/>
        </svg>${textBtnPrimary}
      `;
      btnPrimary.type = 'submit';
      btnPrimary.disabled = disabledBtn;
      form.append(btnPrimary);
    };
    // создание кнопки отмена/удалить
    function createBtnSecond() {
      const btnSecond = document.createElement('button');
      btnSecond.classList.add('btn', 'btn-text', 'form_btn-cancel');
      btnSecond.textContent = textBtnSecond;
      btnSecond.disabled = disabledBtn;

      if (textBtnSecond === 'Отмена' || textBtnSecond === 'Удалить клиента') {
        btnSecond.addEventListener('click', (e) =>{
          e.preventDefault();
          closeModal();
          if (textBtnSecond === 'Удалить клиента') {
            createForm(containerClients, 'form-delete', 'Удалить клиента', 'Удалить', 'Отмена', handlers, idClient, clientElem);
          };
        });
      };
      form.append(btnSecond);
    };

    createBtnPrimary();
    createBtnSecond();

    modal.append(modalBg, form);
    container.append(modal);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearServerErr();

      // отображение на кнопке загрузки данных на сервер
      function loading (loading) {
        const btn = document.querySelector('.btn-primary');
        const loadingIcon = document.querySelector('.btn-primary-loading-icon');
        if (loading) {
          btn.classList.add('btn-primary_loading');
          loadingIcon.classList.add('btn-primary-loading-icon_active');
          formDisabled.classList.add('form__disabled_active');
          return
        };
        btn.classList.remove('btn-primary_loading');
        loadingIcon.classList.remove('btn-primary-loading_active');
        formDisabled.classList.remove('form__disabled_active');
      };

      if (className === 'form-new' || className === 'form-edit') {
        const name = document.querySelector('.form__input-fullname_name');
        const surname = document.querySelector('.form__input-fullname_surname');
        const lastName = document.querySelector('.form__input-fullname_lastname');
        // создание массива с контактами
        function createContactsObj() {
          let contacts = [];
          const selects = document.querySelectorAll('.form__select');
          const inputs = document.querySelectorAll('.form__input-contact');

          for (let i = 0; i < selects.length; i++) {
            const contact = {
              type: selects[i].value,
              value: inputs[i].value.trim(),
            };
            contacts.push(contact);
          };
          return contacts;
        };

        if (validation()) {

          // сбор информации о клиенте в объект
          const data = {
            name: upperFirstLetter(name.value),
            surname: upperFirstLetter(surname.value),
            lastName: upperFirstLetter(lastName.value),
            contacts: createContactsObj(),
          };

          // преобразование ФИО
          function upperFirstLetter (value) {
            if (value.trim()) {
              value = value.trim();
              let firstLetter = value[0].toUpperCase();
              value = value.substr(1).toLowerCase();
              value = firstLetter + value;
              return value;
            };
            return value;
          };

          if (className === 'form-new') {
            handlers.addClient(data, closeModal, serverError, loading);
          };

          if (className === 'form-edit') {
            handlers.editClient(data, idClient, closeModal, serverError, loading);
          };
        };
      };

      if (className === 'form-delete') {
        handlers.deleteClient(idClient, clientElem, closeModal, serverError, loading)
      };
    });
  };

  // валидация формы
  function validation () {
    let validation = true;
    removeValidation();
    validationFullName('surname', 'Фамилия');
    validationFullName('name', 'Имя');
    validationFullName('lastname', 'Отчество');
    validationContacts();
    return validation;

    // валидация ФИО
    function validationFullName (className, nameInput) {
      const input = document.querySelector(`.form__input-fullname_${className}`);
      const value = input.value.trim();
      const err = input.previousElementSibling;

      const reg = /^[A-Za-zА-Яа-яЁё-]+$/;
      if (!value && (nameInput === 'Фамилия' || nameInput === 'Имя')) {
        errorVisible(err, `Заполните это поле`, input);
        validation = false;
      } else if (!value && nameInput === 'Отчество') {
        input.classList.add('is-valid');
      } else if (value.length < 2) {
        errorVisible(err, `${nameInput} менее 2 символов`, input);
        validation = false;
      } else if (!reg.test(value)) {
        errorVisible(err, `${nameInput} может содержать только буквы`, input);
        validation = false;
      } else if (value.length > 20) {
        errorVisible(err, `${nameInput} более 20 символов`, input);
        validation = false;
      } else {
        input.classList.add('is-valid');
      };
    };
    // валидация контактов
    function validationContacts () {
      const contacts = document.querySelectorAll('.form__input-contact');

      const regEmail = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
      const regNum = /^\d+$/;

      contacts.forEach((elem) => {
        let value = elem.value.trim();
        if (elem.inputmask) {
          value = elem.inputmask.unmaskedvalue();
        };
        const err = elem.previousElementSibling;
        if (!value) {
          errorVisible (err, 'Заполните это поле', elem);
          validation = false;
        } else if (elem.type === 'tel' && !regNum.test(value)) {
          errorVisible (err, 'Телефон должен состоять только из цифр', elem);
          validation = false;
        } else if (elem.type === 'tel' && value.length !== 10) {
          errorVisible (err, 'Телефон должен состоять из 10 цифр', elem);
          validation = false;
        } else if (elem.type === 'email' && !regEmail.test(value)) {
          errorVisible (err, 'Email адрес должен быть действительным', elem);
          validation = false;
        } else {
          elem.classList.add('is-valid');
        };
      });
    }
    // отрисовка ошибки с текстом
    function errorVisible (err, text, input) {
      err.textContent = text;
      err.classList.add('form__error_active');
      input.classList.add('is-novalid');
    };
    // очистка валидации
    function removeValidation () {
      document.querySelectorAll('.form__input').forEach(function (input) {
        input.classList.remove('is-valid', 'is-novalid');
      });
      document.querySelectorAll('.form__error').forEach(function (error) {
        error.classList.remove('form__error_active');
        error.textContent = '';
      });
    };
  };

  // создание строки таблицы с данными о клиенте
  function createClientElement(client) {
    const tbody = document.querySelector('.table__body');
    const tr = document.createElement('tr');
    tr.classList.add('table__row');
    // создание ячеек
    for (let i = 0; i < 6; i++) {
      const td = document.createElement('td');
      td.classList.add('table__cell');

      switch (i) {
        case (0):
          td.classList.add('table__cell_id');
          const id = document.createElement('a');
          id.classList.add('table__link-id');
          id.textContent = client.id;
          id.href = `#${client.id}`;
          tr.id = client.id;
          td.append(id);
          // td.textContent = client.id;
          break;
        case (1):
          td.classList.add('table__cell_fullname');
          td.textContent = `${client.surname} ${client.name} ${client.lastName}`;
          break;
        case (2):
          td.classList.add('table__cell_date-created', 'table__drop');
          createCellDate(client.createdAt, td, 'Дата и время создания');
          break;
        case (3):
          td.classList.add('table__cell_date-edit', 'table__drop');
          createCellDate(client.updatedAt, td, 'Последние изменения');
          break;
        case (4):
          td.classList.add('table__cell_contacts', 'table__drop');
          createCellContacts(client.contacts, td);
          break;
        case (5):
          td.classList.add('table__cell_actions', 'table__drop');
          createCellEdit(td, client.id, tr);
          break;
      };
      tr.append(td);
      // создание ячейки для даты
      function createCellDate (objKey, elem, text) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('table__date-wrapper');
        // создание элементов для ячейки
        for (let i = 0; i < 3; i++) {
          const span = document.createElement('span');
          switch (i) {
            case 0:
              span.classList.add('table__discr-cell');
              span.textContent = text;
              break;
            case 1:
              span.classList.add('table__date');
              span.textContent = createStrDate(objKey);
              break;
            case 2:
              span.classList.add('table__time');
              span.textContent = createStrTime(objKey);
              break;
          };
          wrapper.append(span);
        };
        elem.append(wrapper)

        // создание даты
        function createStrDate (objKey) {
          // const day = objKey.getDate();
          // const month = objKey.getMonth();
          // const year = objKey.getFullYear();
          const day = objKey.slice(8, 10);
          const month = objKey.slice(5, 7);
          const year = objKey.slice(0, 4);
          const date = `${day}.${month}.${year}`;
          return date;
        };
        // создание времени
        function createStrTime (objKey) {
          // const hour = objKey.getHours();
          // const min = objKey.getMinutes();
          const hour = objKey.slice(11, 13);
          const min = objKey.slice(14, 16);
          const time = `${hour}:${min}`;
          return time;
        };
      };
      // создание ячейки для контактов
      function createCellContacts (objKey, elem) {
        if (objKey) {
          const span = document.createElement('span');
          span.classList.add('table__discr-cell');
          span.textContent = 'Контакты';

          const ul = document.createElement('ul');
          ul.classList.add('table__contacts-list', 'font-size-0');

          // создание елемента с контактом
          for (let i = 0; i < (objKey.length + 1); i++) {
            const contact = objKey[i];
            const li = document.createElement('li');
            li.classList.add('table__contacts-item');
            // определение иконки для контакта
            function choiseContactIcon (typeContact) {
              switch (typeContact) {
                case 'Телефон':
                case 'Доп. телефон':
                  return `
                    <svg width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="8" fill="#9873FF"/>
                      <path d="M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z" fill="white"/>
                    </svg>
                  `;
                case 'Email':
                  return `
                    <svg width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4 5.75C4 5.3375 4.36 5 4.8 5H11.2C11.64 5 12 5.3375 12 5.75V10.25C12 10.6625 11.64 11 11.2 11H4.8C4.36 11 4 10.6625 4 10.25V5.75ZM8.424 8.1275L11.04 6.59375C11.14 6.53375 11.2 6.4325 11.2 6.32375C11.2 6.0725 10.908 5.9225 10.68 6.05375L8 7.625L5.32 6.05375C5.092 5.9225 4.8 6.0725 4.8 6.32375C4.8 6.4325 4.86 6.53375 4.96 6.59375L7.576 8.1275C7.836 8.28125 8.164 8.28125 8.424 8.1275Z" fill="#9873FF"/>
                    </svg>
                  `;
                case 'Vk':
                  return `
                  <svg width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 0C3.58187 0 0 3.58171 0 8C0 12.4183 3.58187 16 8 16C12.4181 16 16 12.4183 16 8C16 3.58171 12.4181 0 8 0ZM12.058 8.86523C12.4309 9.22942 12.8254 9.57217 13.1601 9.97402C13.3084 10.1518 13.4482 10.3356 13.5546 10.5423C13.7065 10.8371 13.5693 11.1604 13.3055 11.1779L11.6665 11.1776C11.2432 11.2126 10.9064 11.0419 10.6224 10.7525C10.3957 10.5219 10.1853 10.2755 9.96698 10.037C9.87777 9.93915 9.78382 9.847 9.67186 9.77449C9.44843 9.62914 9.2543 9.67366 9.1263 9.90707C8.99585 10.1446 8.96606 10.4078 8.95362 10.6721C8.93577 11.0586 8.81923 11.1596 8.43147 11.1777C7.60291 11.2165 6.81674 11.0908 6.08606 10.6731C5.44147 10.3047 4.94257 9.78463 4.50783 9.19587C3.66126 8.04812 3.01291 6.78842 2.43036 5.49254C2.29925 5.2007 2.39517 5.04454 2.71714 5.03849C3.25205 5.02817 3.78697 5.02948 4.32188 5.03799C4.53958 5.04143 4.68362 5.166 4.76726 5.37142C5.05633 6.08262 5.4107 6.75928 5.85477 7.38684C5.97311 7.55396 6.09391 7.72059 6.26594 7.83861C6.45582 7.9689 6.60051 7.92585 6.69005 7.71388C6.74734 7.57917 6.77205 7.43513 6.78449 7.29076C6.82705 6.79628 6.83212 6.30195 6.75847 5.80943C6.71263 5.50122 6.53929 5.30218 6.23206 5.24391C6.07558 5.21428 6.0985 5.15634 6.17461 5.06697C6.3067 4.91245 6.43045 4.81686 6.67777 4.81686L8.52951 4.81653C8.82136 4.87382 8.88683 5.00477 8.92645 5.29874L8.92808 7.35656C8.92464 7.47032 8.98521 7.80751 9.18948 7.88198C9.35317 7.936 9.4612 7.80473 9.55908 7.70112C10.0032 7.22987 10.3195 6.67368 10.6029 6.09801C10.7279 5.84413 10.8358 5.58142 10.9406 5.31822C11.0185 5.1236 11.1396 5.02785 11.3593 5.03112L13.1424 5.03325C13.195 5.03325 13.2483 5.03374 13.3004 5.04274C13.6009 5.09414 13.6832 5.22345 13.5903 5.5166C13.4439 5.97721 13.1596 6.36088 12.8817 6.74553C12.5838 7.15736 12.2661 7.55478 11.9711 7.96841C11.7001 8.34652 11.7215 8.53688 12.058 8.86523Z"
                    fill="#9873FF" />
                  </svg>
                  `;
                case 'Facebook':
                  return `
                    <svg width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.99999 0C3.6 0 0 3.60643 0 8.04819C0 12.0643 2.928 15.3976 6.75199 16V10.3775H4.71999V8.04819H6.75199V6.27309C6.75199 4.25703 7.94399 3.14859 9.77599 3.14859C10.648 3.14859 11.56 3.30121 11.56 3.30121V5.28514H10.552C9.55999 5.28514 9.24799 5.90362 9.24799 6.53815V8.04819H11.472L11.112 10.3775H9.24799V16C11.1331 15.7011 12.8497 14.7354 14.0879 13.2772C15.3261 11.819 16.0043 9.96437 16 8.04819C16 3.60643 12.4 0 7.99999 0Z" fill="#9873FF"/>
                    </svg>
                  `;
                case 'Другое':
                  return `
                    <svg width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8ZM9.5 6C9.5 5.17 8.83 4.5 8 4.5C7.17 4.5 6.5 5.17 6.5 6C6.5 6.83 7.17 7.5 8 7.5C8.83 7.5 9.5 6.83 9.5 6ZM5 9.99C5.645 10.96 6.75 11.6 8 11.6C9.25 11.6 10.355 10.96 11 9.99C10.985 8.995 8.995 8.45 8 8.45C7 8.45 5.015 8.995 5 9.99Z" fill="#9873FF"/>
                    </svg>
                  `;
              };
            };

            if (i !== objKey.length) {
              const link = document.createElement('a');
              link.classList.add('table__tooltip-link');
              link.href = '#';
              link.innerHTML = choiseContactIcon(contact.type);

              const popup = document.createElement('div');
              popup.classList.add('table__tooltip-popup');

              const type = document.createElement('span');
              type.classList.add('table__contact-type');
              type.textContent = `${contact.type}:`;

              const value = document.createElement('span');
              value.classList.add('table__contact-value');
              value.textContent = contact.value;

              popup.append(type, value);
              li.append(link, popup);
              ul.append(li);
            };

            if (i > 3 && i !== objKey.length && objKey.length > 5) {
              li.classList.add('table__contacts-item_hidden');
            };

            if (i > 5 && i === objKey.length) {
              const btn = document.createElement('button');
              btn.classList.add('btn', 'table__btn-contacts');
              btn.textContent = `+${objKey.length - 4}`;
              btn.addEventListener('click', () => {
                ul.childNodes.forEach((elem) => {
                  elem.classList.add('table__contacts-item_open');
                  elem.classList.remove('table__contacts-item_hidden');
                });
                btn.parentElement.classList.add('table__contacts-item_hidden');
              });
              li.classList.add('table__contacts-item_btn')
              li.append(btn);
              ul.append(li);
            };
          };

          elem.append(span, ul);
        };
      };
      // создание ячейки для действий
      function createCellEdit (elem, idClient, clientElem) {
        // кнопка изменить
        const btnEdit = document.createElement('button');
        btnEdit.classList.add('btn', 'table__btn-actions',  'table__btn-actions_edit');
        btnEdit.innerHTML = `
          <svg class="table__btn-actions-icon table__btn-actions-icon_edit" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11.5002V14.0002H4.5L11.8733 6.62687L9.37333 4.12687L2 11.5002ZM13.8067 4.69354C14.0667 4.43354 14.0667 4.01354 13.8067 3.75354L12.2467 2.19354C11.9867 1.93354 11.5667 1.93354 11.3067 2.19354L10.0867 3.41354L12.5867 5.91354L13.8067 4.69354Z"
              fill="#9873ff" />
          </svg>
          <svg class="table__btn-actions-loading-icon table__btn-actions-loading-icon_edit" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.00008 8.04008C3.00008 10.8236 5.2566 13.0801 8.04008 13.0801C10.8236 13.0801 13.0801 10.8236 13.0801 8.04008C13.0801 5.2566 10.8236 3.00008 8.04008 3.00008C7.38922 3.00008 6.7672 3.12342 6.196 3.34812"
              stroke="#9873FF" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" />
          </svg>Изменить
        `;
        btnEdit.addEventListener('click', () => {
          btnEdit.classList.add('table__btn-actions_loading');
          createForm(containerClients, 'form-edit', false, 'Изменить данные', 'Сохранить', 'Удалить клиента', handlers, idClient, clientElem);
          btnEdit.classList.remove('table__btn-actions_loading');
        });
        // кнопка удалить
        const btnDel = document.createElement('button');
        btnDel.classList.add('btn', 'table__btn-actions',  'table__btn-actions_delete');
        btnDel.innerHTML = `
          <svg class="table__btn-actions-icon table__btn-actions-icon_delete" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z"
            fill="#f06a4d" />
          </svg>
          <svg class="table__btn-actions-loading-icon table__btn-actions-loading-icon_delete" width="16" height="16" viewbox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.00008 8.04008C3.00008 10.8236 5.2566 13.0801 8.04008 13.0801C10.8236 13.0801 13.0801 10.8236 13.0801 8.04008C13.0801 5.2566 10.8236 3.00008 8.04008 3.00008C7.38922 3.00008 6.7672 3.12342 6.196 3.34812"
              stroke="#f06a4d" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" />
          </svg>Удалить
        `;
        btnDel.addEventListener('click', () => {
          btnDel.classList.add('table__btn-actions_loading');
          createForm(containerClients, 'form-delete', false, 'Удалить клиента', 'Удалить', 'Отмена', handlers, idClient, clientElem);
          btnDel.classList.remove('table__btn-actions_loading');
        });
        elem.append(btnEdit, btnDel);
      };

    };
    // аккордион для мобильной версии + отключение подсветки поиска
    tr.addEventListener('click', (e) => {

      //подсветка
      if (tbody.querySelector('.table__cell_search-result') && !e.currentTarget.classList.contains('table__cell_search-result')) {
        tbody.querySelectorAll('.table__cell_search-result').forEach(cell => {
          cell.classList.remove('table__cell_search-result');
        });
      };

      // аккордеон
      if (window.innerWidth < 768) {
        if (tbody.querySelector('.table__row_drop-open') && !e.currentTarget.classList.contains('table__row_drop-open')) {
          closeAccordion();
          if (e.target.classList.contains('table__cell_fullname')) {
            openAccordion(e.target);
          };
          return
        };

        if (e.target.classList.contains('table__cell_fullname')) {
          openAccordion(e.target);
          return
        };

        function openAccordion(target) {
          const client = target.parentElement;
          e.target.classList.add('table__cell_fullname-drop-open');
          client.classList.add('table__row_drop-open');
          client.querySelectorAll('.table__drop').forEach(elem => {
            elem.classList.add('table__drop_open');
          });
        };
        function closeAccordion() {
          tbody.querySelector('.table__cell_fullname-drop-open').classList.remove('table__cell_fullname-drop-open');
          tbody.querySelector('.table__row_drop-open').classList.remove('table__row_drop-open');
          tbody.querySelectorAll('.table__drop_open').forEach(elem => {
            elem.classList.remove('table__drop_open');
          });
        };
      };
    });
    tbody.append(tr);
  };
});
