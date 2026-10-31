<?php

namespace App\Enums;

enum RoleName: string
{
    case Admin = 'admin';
    case Librarian = 'librarian';
    case Member = 'member';

    /**
     * Get all role name values as an array.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
