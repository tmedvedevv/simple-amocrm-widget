define(['jquery', 'underscore', 'twigjs'], function ($, _, twigjs) {
  // Создаем конструктор CustomWidget
  var CustomWidget = function () {
    var self = this;  // Сохраняем контекст для дальнейшего использования

    // Функция для получения и рендеринга шаблонов
    this.getTemplate = (template = '', params = {}, callback) => {
      return this.render({
        href: `/templates/${template}.twig`,  // Путь к шаблону
        base_path: this.params.path,         // Путь для загрузки ресурсов
        v: this.get_version(),               // Версия виджета
        load: callback                       // Колбэк для обработки шаблона после загрузки
      }, params);
    };

    // Универсальная функция для создания кнопок, принимает параметры для шаблона и состояния кнопки
    const createButton = (templateRef, buttonClass, additionalData = '') => {
      return twigjs({ ref: templateRef }).render({
        text: buttonClass.text,              // Текст кнопки
        class_name: `button-input_blue ${buttonClass.disabled ? 'button-input-disabled' : ''} ${buttonClass.className}`, // Классы для кнопки
        additional_data: additionalData     // Дополнительные данные
      });
    };

    // Обработчики для различных событий в виджете
    this.callbacks = {
      render: () => {
        console.log('render');  // Логирование при рендере
        return true;
      },

      // Инициализация виджета
      init: () => {
        console.log('init');
        this.setupNotificationCallback();  // Устанавливаем callback для уведомлений
        this.setupPhoneAction();           // Настроим действие для телефона
        this.setupSMSAction();             // Настроим действие для отправки SMS
        return true;
      },

      // Функция для установки callback уведомлений
      setupNotificationCallback: () => {
        AMOCRM.addNotificationCallback(self.get_settings().widget_code, (data) => {
          console.log(data);  // Логирование данных уведомления
        });
      },

      // Функция для добавления действия для телефона
      setupPhoneAction: () => {
        this.add_action('phone', (params) => {
          console.log(params);  // Логируем параметры действия с телефоном
        });
      },

      // Функция для добавления действия для отправки SMS
      setupSMSAction: () => {
        this.add_source('sms', (params) => {
          return new Promise((resolve, reject) => {
            self.crm_post(  // Отправляем запрос на сервер для отправки SMS
              'https://example.com/',
              params,          // Параметры для отправки
              (msg) => {       // Колбэк после успешного выполнения
                console.log(msg);  // Логируем сообщение
                resolve();          // Успешное завершение
              },
              'text'            // Ожидаемый тип ответа от сервера
            );
          });
        });
      },

      // Обработчик для связывания действий
      bind_actions: () => {
        console.log('bind_actions');  // Логируем привязку действий
        return true;
      },

      // Функция для обработки настроек виджета
      settings: ($modal_body) => {
        this.getTemplate('oferta', {}, (template) => {
          const $install_btn = $('button.js-widget-install');  // Находим кнопку "Установить"
          const $oferta_error = $('div.oferta_error');  // Находим блок ошибки

          // Очищаем поле oferta и добавляем шаблон после последнего видимого элемента
          $modal_body.find('input[name="oferta"]').val('');
          $modal_body.find('.widget_settings_block__item_field:visible')
            .last()
            .after(
              template.render({
                oferta: self.i18n('settings').oferta,  // Текст для поля oferta
                oferta_error: self.i18n('settings').oferta_error  // Текст ошибки
              })
            );

          // Обработчик изменения состояния чекбокса
          $modal_body.find('input[name="oferta_check"]').on('change', (e) => {
            const $checkbox = $(e.currentTarget);
            const value = $checkbox.prop('checked') ? '1' : '';  // Устанавливаем значение для поля oferta
            $modal_body.find('input[name="oferta"]').val(value);
            $oferta_error.toggleClass('hidden', $checkbox.prop('checked'));  // Показываем/скрываем ошибку
          });

          // Обработчик клика на кнопку "Установить"
          $install_btn.on('click', () => {
            if (!$modal_body.find('input[name="oferta"]').val()) {  // Если поле oferta пустое
              $oferta_error.removeClass('hidden');  // Показываем ошибку
            }
          });
        });

        return true;
      },

      // Обработчик для кнопки сохранения
      onSave: () => {
        console.log('click');  // Логируем клик по кнопке "Сохранить"
        return true;
      },

      // Пустой обработчик для уничтожения виджета (можно добавить логику очистки)
      destroy: () => {
        _.noop();  // Пока не нужно ничего делать
      },

      // Обработчик для контактов
      contacts: {
        selected: () => {
          console.log('contacts');  // Логируем выбор контакта
        }
      },

      // Обработчик для сделок
      leads: {
        selected: () => {
          console.log('leads');  // Логируем выбор сделки
        }
      },

      // Обработчик для задач
      tasks: {
        selected: () => {
          console.log('tasks');  // Логируем выбор задачи
        }
      },

      // Функция для отображения расширенных настроек
      advancedSettings: () => {
        const $work_area = $('#work-area-' + self.get_settings().widget_code);  // Ищем область работы
        const $save_button = createButton('/tmpl/controls/button.twig', {
          text: 'Сохранить',  // Текст на кнопке
          className: 'js-button-save-' + self.get_settings().widget_code  // Класс для кнопки
        });
        const $cancel_button = createButton('/tmpl/controls/cancel_button.twig', {
          text: 'Отмена',  // Текст на кнопке
          className: 'js-button-cancel-' + self.get_settings().widget_code  // Класс для кнопки
        });

        console.log('advancedSettings');  // Логируем отображение расширенных настроек

        // Отключаем кнопку "Сохранить" по умолчанию
        $save_button.prop('disabled', true);

        // Устанавливаем стиль для верхней части контента
        $('.content__top__preset').css({ float: 'left' });

        // Добавляем кнопки в верхнюю часть списка
        $('.list__body-right__top').css({ display: 'block' })
          .append('<div class="list__body-right__top__buttons"></div>');
        $('.list__body-right__top__buttons').css({ float: 'right' })
          .append($cancel_button)
          .append($save_button);

        // Рендерим шаблон и добавляем на страницу
        this.getTemplate('advanced_settings', {}, (template) => {
          const $page = $(template.render({
            title: self.i18n('advanced').title,  // Заголовок страницы
            widget_code: self.get_settings().widget_code  // Код виджета
          }));
          $work_area.append($page);  // Добавляем страницу в область работы
        });
      },

      // Метод, вызываемый при сохранении данных в Salesbot
      onSalesbotDesignerSave: (handler_code, params) => {
        const salesbot_source = { question: [], require: [] };
        const salesbot_second_step = { question: [], require: [] };

        // Извлекаем параметры из данных
        const button_title = params.button_title || '';
        const button_caption = params.button_caption || '';
        const text = params.text || '';
        const number = params.number || 0;

        // Создаем шаблон для кнопки
        const handler_template = {
          handler: 'show',
          params: {
            type: 'buttons',
            value: text + ' ' + number,
            buttons: [button_title + ' ' + button_caption]
          }
        };

        console.log(params);  // Логируем параметры

        // Добавляем шаги в salesbot
        salesbot_source.question.push(handler_template);

        const request_data = {};
        if (AMOCRM.getBaseEntity() === 'customers') {
          request_data.customer = '{{customer.id}}';  // Заполняем ID клиента
        } else {
          request_data.lead = '{{lead.id}}';  // Заполняем ID сделки
        }

        // Добавляем запрос к виджету
        salesbot_source.question.push({
          handler: 'widget_request',
          params: {
            url: 'https://example.com/salesbot',
            data: request_data
          }
        });

        salesbot_source.question.push({
          handler: 'goto',
          params: { type: 'question', step: 1 }
        });

        // Добавляем шаги для условий
        salesbot_second_step.question.push({
          handler: 'conditions',
          params: {
            logic: 'and',
            conditions: [{ term1: '{{json.status}}', term2: 'success', operation: '=' }],
            result: [{ handler: 'exits', params: { value: 'success' } }]
          }
        });

        salesbot_second_step.question.push({
          handler: 'exits',
          params: { value: 'fail' }
        });

        return JSON.stringify([salesbot_source, salesbot_second_step]);  // Возвращаем JSON
      },

      // Функция для возвращения настроек Salesbot Designer
      salesbotDesignerSettings: ($body, rowTemplate, params) => {
        return {
          exits: [
            { code: 'success', title: self.i18n('salesbot').success_callback_title },  // Параметры успешного завершения
            { code: 'fail', title: self.i18n('salesbot').fail_callback_title }         // Параметры неудачного завершения
          ]
        };
      },

      // Обработчик для добавления в источник
      onAddAsSource: (pipeline_id) => {
        console.log(pipeline_id);  // Логируем ID пайплайна
      }
    };

    return this;  // Возвращаем экземпляр виджета
  };

  return CustomWidget;  // Экспортируем конструктор виджета
});
