let groupListCache = [];

const handler = async (m, { conn, args, isOwner, command }) => {
  if (!isOwner) return;

  // Actualizar la cache de grupos una vez en .cmd
  if (command === 'cmd') {
    groupListCache = Object.entries(global.db.data.chats)
      .filter(([id]) => id.endsWith('@g.us'))
      .sort(([a], [b]) => a.localeCompare(b)); // Orden alfabético por ID para mantener orden fijo

    const groups = groupListCache.map(([id], i) => {
      const name = conn.chats[id]?.metadata?.subject || 'Desconocido';
      return `${i + 1}: ${name}\nID: ${id}`;
    });

    m.reply(groups.length ? groups.join('\n\n') : 'No hay grupos registrados.');
    return;
  }

  if (command === 'cm') {
    const [action, ...rest] = args;

    if (!action) {
      return m.reply(`Uso:
.cm banchat [#grupo]
.cm unchat [#grupo]
.cm welcome [on/off] [#grupo]
.cm bye [on/off] [#grupo]
.cm setwelcome [mensaje] | [#grupo]
.cm setbye [mensaje] | [#grupo]`);
    }

    const getGroupIdByIndex = (index) => {
      if (groupListCache.length === 0) {
        // Si aún no se ejecutó .cmd, generamos la lista
        groupListCache = Object.entries(global.db.data.chats)
          .filter(([id]) => id.endsWith('@g.us'))
          .sort(([a], [b]) => a.localeCompare(b));
      }
      return groupListCache[index - 1]?.[0];
    };

    // Acciones simples por número
    if (['banchat', 'unchat'].includes(action)) {
      const groupIndex = parseInt(rest[0]);
      const groupId = getGroupIdByIndex(groupIndex);
      if (!groupId) return m.reply('Número de grupo inválido.');
      let chat = global.db.data.chats[groupId] || {};
      chat.isBanned = action === 'banchat';
      global.db.data.chats[groupId] = chat;
      return m.reply(`Grupo ${groupId} ${action === 'banchat' ? 'baneado' : 'desbaneado'}.`);
    }

    // welcome / bye on/off
    if (['welcome', 'bye'].includes(action)) {
      const value = rest[0];
      const groupIndex = parseInt(rest[1]);
      const groupId = getGroupIdByIndex(groupIndex);
      if (!['on', 'off'].includes(value) || !groupId) {
        return m.reply(`Uso: .cm ${action} [on/off] [#grupo]`);
      }
      let chat = global.db.data.chats[groupId] || {};
      chat[action] = value === 'on';
      global.db.data.chats[groupId] = chat;
      return m.reply(`${action === 'welcome' ? 'Bienvenida' : 'Despedida'} en ${groupId} ${value === 'on' ? 'activada' : 'desactivada'}.`);
    }

    // setwelcome / setbye con mensaje y número
    if (['setwelcome', 'setbye'].includes(action)) {
      const joined = rest.join(' ').split('|');
      const message = joined[0]?.trim();
      const groupIndex = parseInt(joined[1]?.trim());
      const groupId = getGroupIdByIndex(groupIndex);
      if (!message || !groupId) {
        return m.reply(`Uso: .cm ${action} [mensaje] | [#grupo]`);
      }
      let chat = global.db.data.chats[groupId] || {};
      chat[action === 'setwelcome' ? 'welcomeMessage' : 'byeMessage'] = message;
      global.db.data.chats[groupId] = chat;
      return m.reply(`${action === 'setwelcome' ? 'Mensaje de bienvenida' : 'Mensaje de despedida'} actualizado para ${groupId}.`);
    }

    m.reply('Acción no reconocida.');
  }
};

handler.command = ['cm', 'cmd'];
handler.owner = true;
export default handler;
