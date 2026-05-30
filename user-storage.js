// Простая клиентская маршрутизация локального хранилища по пользователю
(function(){
  const origGet = localStorage.getItem.bind(localStorage);
  const origSet = localStorage.setItem.bind(localStorage);
  const origRemove = localStorage.removeItem.bind(localStorage);

  function currentUser() {
    return origGet('writer_user');
  }

  const userScopedKeys = new Set(['books', 'currentBook', 'notes', 'visual', 'effectDraft', 'writingCalendarEntries', 'fortuneCoins', 'fortuneLastSpin', 'fortuneExtraSpin', 'fortuneCurrentTask', 'fortunePurchases', 'fortuneHistory']);

  // expose helpers
  window.getCurrentUser = currentUser;
  window.setCurrentUser = function(user) { origSet('writer_user', user); };
  window.logoutCurrentUser = function() { origRemove('writer_user'); };

  localStorage.getItem = function(key) {
    const user = currentUser();
    if (user && userScopedKeys.has(key)) {
      return origGet(`${user}::${key}`);
    }
    return origGet(key);
  };

  localStorage.setItem = function(key, value) {
    const user = currentUser();
    if (user && userScopedKeys.has(key)) {
      return origSet(`${user}::${key}`, value);
    }
    return origSet(key, value);
  };

  localStorage.removeItem = function(key) {
    const user = currentUser();
    if (user && userScopedKeys.has(key)) {
      return origRemove(`${user}::${key}`);
    }
    return origRemove(key);
  };

})();
