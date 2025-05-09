{
  config,
  pkgs,
  lib,
  ...
}:
let
  cfg = config.services.xnode-nodejs-template;
  xnode-nodejs-template = pkgs.callPackage ./package.nix { };
in
{
  options = {
    services.xnode-nodejs-template = {
      enable = lib.mkEnableOption "Enable the node.js app";
    };
  };

  config = lib.mkIf cfg.enable {
    users.groups.xnode-nodejs-template = { };
    users.users.xnode-nodejs-template = {
      isSystemUser = true;
      group = "xnode-nodejs-template";
    };

    systemd.services.xnode-nodejs-template = {
      wantedBy = [ "multi-user.target" ];
      description = "Node.js App.";
      after = [ "network.target" ];
      serviceConfig = {
        ExecStart = "${lib.getExe xnode-nodejs-template}";
        User = "xnode-nodejs-template";
        Group = "xnode-nodejs-template";
      };
    };
  };
}
