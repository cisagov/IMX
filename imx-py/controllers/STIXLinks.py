"""
STIXLinks

This class implements a link list that can be used to persist
Graphic User Interface attributes.   Each node in the link
list will contain a parent pointer, a list of child pointers,
a GUI ID, a type, and a dictionary of attributes for the window.
Each node has a dictionary of attributes associated with the node
along with a type and guid identifier. The user must form the
connectivity between nodes (see the main at the bottom for how
to accomplish this). If you dump or traverse the nodes, make
sure you access the parent node to get all connected nodes.
The public interface consists of:

  deploy2 -         Takes link list and creates STIX xml
  dump -            Prints the link list for debugging
  get_attribs -      Return dictionary of attributes for node
  get_children -     Returns list of child nodes
  get_guid  -        Returns node guid
  get_parent -       Returns node parent
  import_xml -       Read in a STIX xml file
  set_attribs -      Returns dict of values from node
  set_guid -         Sets node guid
  set_type -         Sets node type (e.g., fqdn, file, email)
  to_dict -         Return dict ref of node
  walk -            Returns list of nodes for tree

Changes:
  4/12/2020 Refactored docFactory.0.3.0 for Python 3.8.4
            stix 1.1.1.8/cybox 2.1.0.21/lxml 4.5.0
  4/20/2020 Fixed Foreign Characters
  4/29/2020 AIS now using API
  6/23/2020 Removed deploy and findByGuid methods
  8/27/2020 Added ATT&CK Patterns
  4/28/2021 Brought Version Forward
  10/30/2023 - TPGIBv1.4 #66 - Modified to handle indicators of type ipv6.

"""

import json
import os
import sys
import time

import controllers.STIXHelper as STIXHelper

__version__ = os.getenv("VERSION")
__revised__ = "5/5/2026"

node_list = []


class Node:
    def __init__(self, the_parent=None):
        self.id = None
        self.attribs = {}
        self.debug = False  # MKPMKP
        self.type = None
        self.guid = None
        self.parent = None
        self.stixref = None
        self.children = []
        self.version = os.getenv("VERSION")
        if self.debug:
            print("STIXLinks(100)")

        if the_parent is not None:
            the_parent.children.append(self)
            self.parent = the_parent

    # End of __init__

    def get_version(self):
        """
        Returns class version
        """
        return self.version

    # End of get_version

    def set_attribs(self, the_attribs):
        """
        Sets node attributes to a given dictionary
        @param the_attribs<dict> Values associated with a GUI window
        """
        # Make sure to remove whitespace from strings
        for key in the_attribs.keys():
            if type(the_attribs[key]) == type(""):
                self.attribs[key] = (the_attribs[key]).strip()
            else:
                self.attribs[key] = the_attribs[key]

    # End of set_attribs

    def set_guid(self, the_guid):
        """
        Sets node GUI ID to the given guid
        @param the_guid
        """
        self.guid = the_guid

    # End of set_guid

    def set_type(self, the_type):
        """
        Sets node type to the window type
        @the_type<string> Either package, indicator, fqdn, file, email, mutex,
               registry, url, or link
        """
        self.type = the_type

    # End of set_type

    def get_guid(self):
        """
        Returns the GUI ID
        @return guid
        """
        return self.guid

    # End of get_guid

    def get_parent(self):
        """
        Returns the parent node
        @return parent node
        """
        return self.parent

    # End of get_parent

    def get_attribs(self):
        """
        Returns the attributes for this node
        @return attributes<dict>
        """
        return self.attribs

    # End of get_attribs

    def get_type(self):
        """
        Returns the node type
        @param<string> node type
        """
        return self.type

    # End of get_type

    def get_children(self):
        """
        Returns the child list
        @return<list> children
        """
        return self.children

    # End of get_children

    def to_dict(self):
        """
        Returns a dictionary rep of this node
        @return<dict> node equivalent of to_string
        """
        rtn = {
            "attribs": self.attribs,
            "parent": self.parent,
            "children": self.children,
            "guid": self.guid,
        }

        if self.id is not None:
            rtn["guid"] = self.id

        return rtn

    # End of to_dict

    def walk(self):
        """
        Return a list of nodes for entire tree
        @return<list> node list
        """
        global node_list
        node_list = []
        return self.do_walk()

    # End of walk

    def do_walk(self):
        """
        Return a list of nodes for entire tree
        Private; only call walk
        @return<list> node list
        """
        global node_list
        if self is not None:
            global node_list
            node_list.append(self)
            for kid in self.children:
                kid.do_walk()
        return node_list

    # End of do_walk

    def deploy2(self, version, stix_type):
        """
        Used as a direct access API variant of deploy()
        Call with root node
        @param filename<string> File to write to
        @param version<string> STIXGui version watermark
        @param stix_type - The type of STIX: xml or ais
        @returns String xml
        """
        tree_list = self.walk()

        stix = STIXHelper.STIXHelper(stix_type)

        if self.debug:
            self.dump()  # MKPMKP
        # ========= test ================
        # TESTTEST tree_list is a list
        # print("XXX ",tree_list.__class__)
        # print(dict((k,2) for k in tree_list))
        # print("STIXLinks(111): NODE=",tree_list.to_dict())
        # ==============================

        stix_obj = None
        for node in tree_list:
            guid = node.get_guid()
            node_type = node.get_type()
            parent = node.get_parent()  # points to parent node
            attribs = node.get_attribs()
            # ===================================
            # print(node.__class__)
            # print("======> Type: ",type," Guid: ",guid)
            # print(Guid: ",guid)
            # print("Parent: ",parent)
            # print("Attribs: ",attribs)
            # ===================================
            if self.debug:
                print(
                    "======>STIXLinks(200): deploy: ",
                    node_type,
                    ",guid=",
                    guid,
                    ",attribs=",
                    attribs,
                    ",node=",
                    node.__class__,
                )
                print("STIXLinks(201): deploy: parent=", parent, "stix_obj=", stix_obj)

            if node.get_type() == STIXHelper.MAIN_WHICH_VALUE:
                stix.set_main(node.get_attribs(), stix_type)
            elif node.get_type() == STIXHelper.IND_WHICH_VALUE:
                stix_obj = stix.create_indicator(node.get_attribs(), guid, stix_type)
            elif node.get_type() == STIXHelper.FQDN_WHICH_VALUE:
                stix_obj = stix.create_fqdn(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.MUTEX_WHICH_VALUE:
                stix_obj = stix.create_mutex(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.FILE_WHICH_VALUE:
                stix_obj = stix.create_file(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.EMAIL_WHICH_VALUE:
                stix_obj = stix.create_email(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.IPV4_WHICH_VALUE:
                stix_obj = stix.create_ipv4(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.IPV6_WHICH_VALUE:
                stix_obj = stix.create_ipv6(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.LINK_WHICH_VALUE:
                stix_obj = stix.create_link(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.NETCON_WHICH_VALUE:
                stix_obj = stix.create_netcon(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.REG_WHICH_VALUE:
                stix_obj = stix.create_registry(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.UA_WHICH_VALUE:
                stix_obj = stix.create_user_agent(
                    node.get_attribs(), stix_obj, guid, stix_type
                )
            elif node.get_type() == STIXHelper.URL_WHICH_VALUE:
                stix_obj = stix.create_url(
                    node.get_attribs(), stix_obj, guid, stix_type
                )

        # Note: buffer is raw (only ASCII) convert to Unicode/UTF-8
        buffer = stix.to_xml()
        ###if isinstance(buffer, bytes):
        ###buffer = buffer.decode('utf-8')

        # ===========================================
        # Bug fix 20150619-03 Marlon's fix till Mitre updates this
        buffer = buffer.replace(
            '<LinkObj:Properties xsi:type="LinkObj:LinkObjectType">',
            '<cybox:Properties xsi:type="LinkObj:LinkObjectType">',
        )
        buffer = buffer.replace("</LinkObj:Properties>", "</cybox:Properties>")

        buffer = (
            "<!-- Generated by IMX on " + time.strftime("%m/%d/%Y") + " -->\n" + buffer
        )
        buffer = '<?xml version="1.0" encoding="utf-8" ?>\n' + buffer
        return buffer

    # End of deploy2

    def import_xml(self, filename, stix_type):
        """
        Reads in an xml file and converts to link list
        Calls find_children
        Usage:  nx = node()
                nx.import_xml('ttttt.xml')
        @param<string> filename of stix xml file
        @param<string> stix_type - The type of STIX: xml or ais
        """

        links = self
        sh = STIXHelper.STIXHelper(stix_type)
        if sh.import_stix(filename):
            # Main
            links.set_attribs(sh.get_main())
            links.set_type(STIXHelper.MAIN_WHICH_VALUE)

            node_list = sh.gather()
            node_id = None
            count = 0
            # Traverse high level Indicators
            for item in node_list:
                if self.debug:
                    print("STIXLinks(300): NODE=", json.dumps(item.to_dict()))
                ind_dict = {}
                obs_dict = {}
                node_id = None
                the_dict = sh.get_attributres(item)

                if self.debug:
                    print("STIXLinks(400) import_xml: type=", type(item), "\n")
                    print("STIXLinks(500) import_xml: id=", item._id, "\n")
                    print("STIXLinks(700) import_xml: dict=", the_dict, "\n")

                if not bool(the_dict):
                    if self.debug:
                        print(
                            "STIXLinks(800) import_xml: Found composite component:",
                            type(item),
                            "\n",
                        )

                node_id = item._id
                for i in the_dict:
                    if i in ["desc", "type", "tlp", "fouo", "sighted", "phase"]:
                        ind_dict[i] = the_dict[i]
                    elif i in ["id"]:
                        node_id = the_dict[i]
                    else:
                        obs_dict[i] = the_dict[i]
                ind_node = Node(links)
                ind_dict["which"] = "indicator"
                ind_node.set_attribs(ind_dict)
                ind_node.set_type(STIXHelper.IND_WHICH_VALUE)
                if node_id is not None:
                    if self.debug:
                        print("STIXLinks(900) import_xml Processing ", node_id, "\n")
                    ind_node.set_guid(node_id)
                else:
                    ind_node.set_guid(str(count))
                count = count + 1

                if item.observable is not None:
                    self.find_children(sh, item.observable.object_, ind_node)

            if self.debug:
                # if True:
                print("------------------ import_xml---------------")
                self.dump()

            if self.debug:
                print("STIXLinks(1000) import_xml: Object count ", count, "\n")

    # End of import_xml

    def find_children(self, sh, item, parent):
        """
        Update link list with subordinate Observables
        Called from import_xml
        @param sh - A STIXHelper reference
        @param item - Expects only cybox.objects...
               Should see properties and related_objects[]
        @param parent - Link list node
        """
        if self.debug:
            print(
                "STIXLinks(1100) find_children: item=",
                type(item),
                parent,
                parent.get_guid(),
            )
            print("STIXLinks(1300) ", parent.get_guid(), json.dumps(item.to_dict()))

        if hasattr(item, "properties"):
            offset = item.properties
            obs_dict = sh.get_attributres(offset)
            if obs_dict == {} or obs_dict is None:
                return
            if hasattr(item, "relationship"):
                # print(dir(item.relationship))
                obs_dict["related"] = item.relationship.value
            obs_node = Node(parent)
            obs_node.set_guid(item.id_)
            obs_node.set_attribs(obs_dict)
            if "which" in obs_dict:
                obs_node.set_type(obs_dict["which"])
            if self.debug:
                print(
                    "STIXLinks(1400) find_children: found ", type(item), item, obs_dict
                )

            if hasattr(item, "related_objects"):
                for i in item.related_objects:
                    self.find_children(sh, i, obs_node)

    # End of find_children

    def dump(self):
        print("============= Links.py Link List ===============")
        mylist = self.walk()
        for child in mylist:
            print("=>", child.get_type(), "(", child, ")")
            print("   attr=", child.get_attribs())
            print("   parent=", child.get_parent())
            print("   guid=", child.get_guid())
        print("======== End Dump Link List ========")

    # End of dump


if __name__ == "__main__":
    n1 = Node()
    if True:
        print("Links version: " + n1.get_version())
        print(__doc__)
        sys.exit()

    ### This is a test main ###

    # Package
    print("Links Version: ", n1.get_version())
    n1.set_type(STIXHelper.MAIN_WHICH_VALUE)
    n1.set_attribs(
        {
            "docid": "the docid",
            "doctitle": "the doctitle",
            "intent": "Indicators - Watchlist",
            "tlp": "GREEN",
            "fouo": True,
            "produced": "2014-09-02",
            "overview": "theoverview",
        }
    )
    n1.set_guid("A")

    # child 1
    n2 = Node(n1)
    n2.set_type(STIXHelper.IND_WHICH_VALUE)
    n2.set_attribs(
        {
            "desc": "thedesc",
            "type": "C2",
            "phase": "Delivery",
            "sighted": "2014-01-15",
            "fouo": True,
            "tlp": "AMBER",
        }
    )
    n2.set_guid("AB")

    # Child 2
    n3 = Node(n1)
    n3.set_type(STIXHelper.IND_WHICH_VALUE)
    n3.set_guid("AC")
    n3.set_attribs(
        {
            "desc": "also the desc",
            "type": "IP Watchlist",
            "phase": "Exploitation",
            "tlp": "RED",
        }
    )

    # Child 3
    n4 = Node(n2)
    n4.set_type("file")
    n4.set_guid("ACB")
    n4.set_attribs(
        {
            "filename": "text.txt",
            "path": "c:/temp",
            "size": "12345",
            "md5": "ABC123DEF456",
            "sha1": "000000",
        }
    )

    # Child 4
    n5 = Node(n3)
    n5.set_type(STIXHelper.FQDN_WHICH_VALUE)
    n5.set_guid("ACA")
    n5.set_attribs({"fqdn": "2222"})

    # Child 5
    n6 = Node(n5)
    n6.set_type(STIXHelper.FQDN_WHICH_VALUE)
    n6.set_guid("ABA")
    n6.set_attribs({"fqdn": "11111", "related": "Copied"})

    # Child 6
    n7 = Node(n6)
    n7.set_type("mutex")
    n7.set_guid("ACBA")
    n7.set_attribs({"mutex": "themutex", "related": "Copied_From"})

    # Child A
    n20 = Node(n1)
    n20.set_type(STIXHelper.IND_WHICH_VALUE)
    n20.set_attribs({"desc": "foxbat"})
    n20.set_guid("ZZZ")

    # Child B
    n21 = Node(n20)
    n21.set_type("mutex")
    n21.set_guid("WWWWW")
    n21.set_attribs({"mutex": "mutexmutext"})

    # ----------------------------------
    nx = None
    if 1 == 1:
        print("===== import xml ===========")
        nx = Node()
        nx.import_xml("ttttt.xml", "xml")
        nx.dump()

    # ----------------------------------
    if 1 == 2:
        print("N1=", n1.get_guid(), " ", n1.get_type(), " ", n1.get_attribs())
        for child in n1.get_children():
            print("child: ", child.get_guid())
        print("N2=", n2.get_guid(), " ", n2.get_type(), " ", n2.get_attribs())
        for child in n2.get_children():
            print("child: ", child.get_guid())
        print("N3=", n3.get_guid(), " ", n3.get_type(), " ", n3.get_attribs())
        for child in n3.get_children():
            print("child: ", child.get_guid())
        print("N4=", n4.get_guid(), " ", n4.get_type(), " ", n4.get_attribs())
        for child in n4.get_children():
            print("child: ", child.get_guid())
        print("N5=", n5.get_guid(), " ", n5.get_type(), " ", n5.get_attribs())
        for child in n5.get_children():
            print("child: ", child.get_guid())
        print("N6=", n6.get_guid(), " ", n6.get_type(), " ", n6.get_attribs())
        for child in n6.get_children():
            print("child: ", child.get_guid())
        print("N7=", n7.get_guid(), " ", n7.get_type(), " ", n7.get_attribs())
        for child in n7.get_children():
            print("child: ", child.get_guid())
    # ----------------------------------
    if 1 == 2:
        n3.swapChildren(0, 1)
        print("N3=", n3.get_guid(), " ", n3.get_type(), " ", n3.get_attribs())
        for child in n3.get_children():
            print("child: ", child.get_guid())
        sys.exit()

    # ----------------------------------
    if 1 == 2:
        print("Walk of n1 tree")
        mylist = nx.walk()
        for child in mylist:
            print(
                "node=",
                child.get_guid(),
                " ",
                child.get_type(),
                " ",
                child.get_attribs(),
            )

        sys.exit()
    # --------------------------------
    if 1 == 2:
        sys.exit()
    # --------------------------------
    if 1 == 2:
        print("Delete ACB")
        n6.delete()
        print("N3=", n3.get_guid())
        for child in n3.get_children():
            print(child.get_guid())
        sys.exit()
