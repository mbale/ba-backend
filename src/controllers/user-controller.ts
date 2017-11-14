



// //   async changePassword(request, reply) {
// //     try {
// //       const {
// //         auth: {
// //           credentials: {
// //             user,
// //           },
// //         },
// //         payload: {
// //           oldPassword,
// //           newPassword,
// //         },
// //       } = request;

// //       await user.comparePassword(oldPassword);
// //       // ok we change
// //       await user.changePassword(newPassword);

// //       return reply();
// //     } catch (error) {
// //       if (error instanceof PasswordMismatchError) {
// //         return reply.unauthorized(error.message);
// //       }
// //       return reply.badImplementation(error);
// //     }
// //   },
// // };
