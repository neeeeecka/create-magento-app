const deleteAdminUsers = {
    title: 'Deleting old admin users',
    task: async (ctx) => {
        const { mysqlConnection } = ctx;
        await mysqlConnection.query(`
            DELETE FROM admin_user;
        `);
    }
};

module.exports = deleteAdminUsers;
