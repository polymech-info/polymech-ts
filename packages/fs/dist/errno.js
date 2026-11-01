export const errno = [
    {
        errno: -2,
        code: 'ENOENT',
        description: 'no such file or directory'
    },
    {
        errno: -1,
        code: 'UNKNOWN',
        description: 'unknown error'
    },
    {
        errno: 0,
        code: 'OK',
        description: 'success'
    },
    {
        errno: 1,
        code: 'EOF',
        description: 'end of file'
    },
    {
        errno: 2,
        code: 'EADDRINFO',
        description: 'getaddrinfo error'
    },
    {
        errno: 3,
        code: 'EACCES',
        description: 'permission denied'
    },
    {
        errno: 4,
        code: 'EAGAIN',
        description: 'resource temporarily unavailable'
    },
    {
        errno: 5,
        code: 'EADDRINUSE',
        description: 'address already in use'
    },
    {
        errno: 6,
        code: 'EADDRNOTAVAIL',
        description: 'address not available'
    },
    {
        errno: 7,
        code: 'EAFNOSUPPORT',
        description: 'address family not supported'
    },
    {
        errno: 8,
        code: 'EALREADY',
        description: 'connection already in progress'
    },
    {
        errno: 9,
        code: 'EBADF',
        description: 'bad file descriptor'
    },
    {
        errno: 10,
        code: 'EBUSY',
        description: 'resource busy or locked'
    },
    {
        errno: 11,
        code: 'ECONNABORTED',
        description: 'software caused connection abort'
    },
    {
        errno: 12,
        code: 'ECONNREFUSED',
        description: 'connection refused'
    },
    {
        errno: 13,
        code: 'ECONNRESET',
        description: 'connection reset by peer'
    },
    {
        errno: 14,
        code: 'EDESTADDRREQ',
        description: 'destination address required'
    },
    {
        errno: 15,
        code: 'EFAULT',
        description: 'bad address in system call argument'
    },
    {
        errno: 16,
        code: 'EHOSTUNREACH',
        description: 'host is unreachable'
    },
    {
        errno: 17,
        code: 'EINTR',
        description: 'interrupted system call'
    },
    {
        errno: 18,
        code: 'EINVAL',
        description: 'invalid argument'
    },
    {
        errno: 19,
        code: 'EISCONN',
        description: 'socket is already connected'
    },
    {
        errno: 20,
        code: 'EMFILE',
        description: 'too many open files'
    },
    {
        errno: 21,
        code: 'EMSGSIZE',
        description: 'message too long'
    },
    {
        errno: 22,
        code: 'ENETDOWN',
        description: 'network is down'
    },
    {
        errno: 23,
        code: 'ENETUNREACH',
        description: 'network is unreachable'
    },
    {
        errno: 24,
        code: 'ENFILE',
        description: 'file table overflow'
    },
    {
        errno: 25,
        code: 'ENOBUFS',
        description: 'no buffer space available'
    },
    {
        errno: 26,
        code: 'ENOMEM',
        description: 'not enough memory'
    },
    {
        errno: 27,
        code: 'ENOTDIR',
        description: 'not a directory'
    },
    {
        errno: 28,
        code: 'EISDIR',
        description: 'illegal operation on a directory'
    },
    {
        errno: 29,
        code: 'ENONET',
        description: 'machine is not on the network'
    },
    {
        errno: 31,
        code: 'ENOTCONN',
        description: 'socket is not connected'
    },
    {
        errno: 32,
        code: 'ENOTSOCK',
        description: 'socket operation on non-socket'
    },
    {
        errno: 33,
        code: 'ENOTSUP',
        description: 'operation not supported on socket'
    },
    {
        errno: 34,
        code: 'ENOENT',
        description: 'no such file or directory'
    },
    {
        errno: 35,
        code: 'ENOSYS',
        description: 'function not implemented'
    },
    {
        errno: 36,
        code: 'EPIPE',
        description: 'broken pipe'
    },
    {
        errno: 37,
        code: 'EPROTO',
        description: 'protocol error'
    },
    {
        errno: 38,
        code: 'EPROTONOSUPPORT',
        description: 'protocol not supported'
    },
    {
        errno: 39,
        code: 'EPROTOTYPE',
        description: 'protocol wrong type for socket'
    },
    {
        errno: 40,
        code: 'ETIMEDOUT',
        description: 'connection timed out'
    },
    {
        errno: 41,
        code: 'ECHARSET',
        description: 'invalid Unicode character'
    },
    {
        errno: 42,
        code: 'EAIFAMNOSUPPORT',
        description: 'address family for hostname not supported'
    },
    {
        errno: 44,
        code: 'EAISERVICE',
        description: 'servname not supported for ai_socktype'
    },
    {
        errno: 45,
        code: 'EAISOCKTYPE',
        description: 'ai_socktype not supported'
    },
    {
        errno: 46,
        code: 'ESHUTDOWN',
        description: 'cannot send after transport endpoint shutdown'
    },
    {
        errno: 47,
        code: 'EEXIST',
        description: 'file already exists'
    },
    {
        errno: 48,
        code: 'ESRCH',
        description: 'no such process'
    },
    {
        errno: 49,
        code: 'ENAMETOOLONG',
        description: 'name too long'
    },
    {
        errno: 50,
        code: 'EPERM',
        description: 'operation not permitted'
    },
    {
        errno: 51,
        code: 'ELOOP',
        description: 'too many symbolic links encountered'
    },
    {
        errno: 52,
        code: 'EXDEV',
        description: 'cross-device link not permitted'
    },
    {
        errno: 53,
        code: 'ENOTEMPTY',
        description: 'directory not empty'
    },
    {
        errno: 54,
        code: 'ENOSPC',
        description: 'no space left on device'
    },
    {
        errno: 55,
        code: 'EIO',
        description: 'i/o error'
    },
    {
        errno: 56,
        code: 'EROFS',
        description: 'read-only file system'
    },
    {
        errno: 57,
        code: 'ENODEV',
        description: 'no such device'
    },
    {
        errno: 58,
        code: 'ESPIPE',
        description: 'invalid seek'
    },
    {
        errno: 59,
        code: 'ECANCELED',
        description: 'operation canceled'
    }
];
export const code = {};
errno.forEach(function (error) {
    code[error.code] = error;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJybm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXJybm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHO0lBQ2pCO1FBQ0UsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNULElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLDJCQUEyQjtLQUN6QztJQUNEO1FBQ0UsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNULElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLGVBQWU7S0FDN0I7SUFDRDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxFQUFFLElBQUk7UUFDVixXQUFXLEVBQUUsU0FBUztLQUN2QjtJQUNEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLEVBQUUsS0FBSztRQUNYLFdBQVcsRUFBRSxhQUFhO0tBQzNCO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksRUFBRSxXQUFXO1FBQ2pCLFdBQVcsRUFBRSxtQkFBbUI7S0FDakM7SUFDRDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxFQUFFLFFBQVE7UUFDZCxXQUFXLEVBQUUsbUJBQW1CO0tBQ2pDO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLGtDQUFrQztLQUNoRDtJQUNEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLEVBQUUsWUFBWTtRQUNsQixXQUFXLEVBQUUsd0JBQXdCO0tBQ3RDO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksRUFBRSxlQUFlO1FBQ3JCLFdBQVcsRUFBRSx1QkFBdUI7S0FDckM7SUFDRDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxFQUFFLGNBQWM7UUFDcEIsV0FBVyxFQUFFLDhCQUE4QjtLQUM1QztJQUNEO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFDUixJ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