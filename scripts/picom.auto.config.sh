#!/usr/bin/env bash
cd /
chown -R pi:pi /media/usb
if grep -qs '/media/usb ' /proc/mounts; then
    echo "'/media/usb already mounted"
else
    echo "Mounting Drive"
    mount /dev/sda1 /media/usb -o uid=pi,gid=pi
fi


node /etc/picom/bin/auto-config.js